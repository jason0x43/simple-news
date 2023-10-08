mod api;
mod db;
mod error;
mod spa;
mod state;
mod types;
mod util;

use axum::{
    routing::{get, post},
    Router, ServiceExt,
};
use dotenvy::dotenv;
use log::info;
use sqlx::sqlite::SqlitePoolOptions;
use tower_http::{normalize_path::NormalizePath, trace::TraceLayer};

use crate::{
    api::{create_user, get_articles},
    spa::static_handler,
    state::AppState,
};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    dotenv().ok();

    tracing_subscriber::fmt::init();

    let db_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set.");

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;
    let app_state = AppState { pool };

    let app = NormalizePath::trim_trailing_slash(
        Router::new()
            .route("/users", post(create_user))
            .route("/articles", get(get_articles))
            .fallback(static_handler)
            .with_state(app_state)
            .layer(TraceLayer::new_for_http()),
    );

    let server = axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service());

    info!("Listening on {}...", server.local_addr());
    server.await.unwrap();

    Ok(())
}
