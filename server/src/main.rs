mod api;
mod db;
mod error;
mod extractors;
mod rss;
mod spa;
mod state;
mod types;
mod types_ts;
mod util;

use axum::{
    routing::{delete, get, post},
    Router,
};
use dotenvy::dotenv;
use log::info;
use sqlx::sqlite::SqlitePoolOptions;
use tower_http::trace::TraceLayer;

use crate::{spa::static_handler, state::AppState};

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
        .route("/me", get(api::get_session_user))
        .route("/users", post(api::create_user))
        .route("/users", get(api::get_users))
        .route("/login", post(api::create_session))
        .route("/articles", get(api::get_articles))
        .route("/feeds/log", get(api::get_all_feed_logs))
        .route("/feeds/refresh", get(api::refresh_feeds))
        .route("/feeds/:id/refresh", get(api::refresh_feed))
        .route("/feeds/:id/articles", get(api::get_feed_articles))
        .route("/feeds/:id/log", get(api::get_feed_log))
        .route("/feeds/:id", get(api::get_feed))
        .route("/feeds/:id", delete(api::delete_feed))
        .route("/feeds", get(api::get_feeds))
        .route("/feeds", post(api::add_feed))
        .route("/feedgroups", get(api::get_all_feed_groups))
        .route("/feedgroups", post(api::create_feed_group))
        .route("/feedgroups/:id", get(api::get_feed_group))
        .route("/feedgroups/:id", post(api::add_group_feed))
        .route("/feedgroups/:id/:feed_id", delete(api::remove_group_feed))
        .route("/feedstats", get(api::get_feed_stats))
        .fallback(static_handler)
        .with_state(app_state)
        .layer(TraceLayer::new_for_http());

    let server = axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service());

    info!("Listening on {}...", server.local_addr());
    server.await.unwrap();

    Ok(())
}
