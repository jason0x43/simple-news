mod api;
mod db;
mod error;
mod extractors;
mod rss;
mod spa;
mod state;
mod types;
mod util;

use axum::{
    routing::{get, post},
    Router,
};
use dotenvy::dotenv;
use log::info;
use sqlx::sqlite::SqlitePoolOptions;
use tower_http::trace::TraceLayer;

use crate::{
    api::{create_session, create_user, get_articles, list_users, add_feed},
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

    let app = Router::new()
        .route("/users", post(create_user).get(list_users))
        .route("/login", post(create_session))
        .route("/articles", get(get_articles))
        .route("/feeds", post(add_feed))
        .fallback(static_handler)
        .with_state(app_state)
        .layer(TraceLayer::new_for_http());

    let server = axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service());

    info!("Listening on {}...", server.local_addr());
    server.await.unwrap();

    Ok(())
}
