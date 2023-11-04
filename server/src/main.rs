mod db;
mod error;
mod extractors;
mod handlers;
mod rss;
mod spa;
mod state;
mod templates;
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
use tower_http::{compression::CompressionLayer, trace::TraceLayer};

use crate::state::AppState;

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

    let api = Router::new()
        .route("/me", get(handlers::get_session_user))
        .route("/users", post(handlers::create_user))
        .route("/users", get(handlers::get_users))
        .route("/login", post(handlers::create_session))
        .route("/articles", get(handlers::get_articles))
        .route("/articles/:id", get(handlers::get_article))
        .route("/feeds/log", get(handlers::get_all_feed_logs))
        .route("/feeds/refresh", get(handlers::refresh_feeds))
        .route("/feeds/:id/refresh", get(handlers::refresh_feed))
        .route("/feeds/:id/articles", get(handlers::get_feed_articles))
        .route("/feeds/:id/log", get(handlers::get_feed_log))
        .route("/feeds/:id", get(handlers::get_feed))
        .route("/feeds/:id", delete(handlers::delete_feed))
        .route("/feeds", get(handlers::get_feeds))
        .route("/feeds", post(handlers::add_feed))
        .route("/feedgroups", get(handlers::get_all_feed_groups))
        .route("/feedgroups", post(handlers::create_feed_group))
        .route("/feedgroups/:id", get(handlers::get_feed_group))
        .route("/feedgroups/:id", post(handlers::add_group_feed))
        .route(
            "/feedgroups/:id/articles",
            get(handlers::get_feed_group_articles),
        )
        .route(
            "/feedgroups/:id/:feed_id",
            delete(handlers::remove_group_feed),
        )
        .route("/feedstats", get(handlers::get_feed_stats))
        .layer(CompressionLayer::new());

    let spa = Router::new()
        .route("/", get(spa::index_html))
        .route("/index.html", get(spa::index_html))
        .fallback(spa::spa_handler)
        .layer(CompressionLayer::new());

    let app = Router::new()
        .route("/login", get(handlers::show_login_page))
        .route("/login", post(handlers::login))
        .nest("/api", api)
        .nest("/reader", spa)
        .fallback(handlers::public_files)
        .with_state(app_state)
        .layer(TraceLayer::new_for_http());

    let server = axum::Server::bind(&"0.0.0.0:3333".parse().unwrap())
        .serve(app.into_make_service());

    info!("Listening on {}...", server.local_addr());
    server.await.unwrap();

    Ok(())
}
