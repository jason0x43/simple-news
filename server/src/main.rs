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

use std::time::Duration;

use axum::{
    routing::{delete, get, patch, post},
    Router,
};
use dotenvy::dotenv;
use error::AppError;
use log::info;
use sqlx::{migrate, query, sqlite::SqlitePoolOptions};
use tower_http::{compression::CompressionLayer, trace::TraceLayer};

use crate::{
    state::AppState,
    types::{Feed, FeedLog},
    util::get_timestamp,
};

#[tokio::main]
async fn main() -> Result<(), AppError> {
    dotenv().ok();

    tracing_subscriber::fmt::init();

    let db_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set.");
    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await?;
    migrate!("../server/migrations").run(&pool).await?;
    let latest_migration = query!(
        r#"
        SELECT description
        FROM _sqlx_migrations
        WHERE success = 1
        ORDER BY installed_on DESC
        LIMIT 1
        "#,
    )
    .fetch_one(&pool)
    .await?;
    info!(
        "Latest applied migration is '{}'",
        latest_migration.description
    );

    let app_state = AppState { pool: pool.clone() };

    let api = Router::new()
        .route("/me", get(handlers::get_session_user))
        .route("/users", post(handlers::create_user))
        .route("/users", get(handlers::get_users))
        .route("/login", post(handlers::create_session))
        .route("/articles", get(handlers::get_articles))
        .route("/articles", patch(handlers::mark_articles))
        .route("/articles/:id", get(handlers::get_article))
        .route("/articles/:id", patch(handlers::mark_article))
        .route("/feeds/log", get(handlers::get_all_feed_logs))
        .route("/feeds/refresh", get(handlers::refresh_feeds))
        .route("/feeds/:id/refresh", get(handlers::refresh_feed))
        .route("/feeds/:id/articles", get(handlers::get_feed_articles))
        .route("/feeds/:id/log", get(handlers::get_feed_log))
        .route("/feeds/:id/stats", get(handlers::get_feed_stat))
        .route("/feeds/:id", get(handlers::get_feed))
        .route("/feeds/:id", delete(handlers::delete_feed))
        .route("/feeds/:id", patch(handlers::update_feed))
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
        .route("/", get(handlers::root))
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

    // Refresh loop
    let update_secs = 1800;
    tokio::spawn(async move {
        loop {
            let last_update =
                FeedLog::last_update(&pool).await.unwrap().unix_timestamp();
            let now = get_timestamp(0).unix_timestamp();

            if now - last_update >= update_secs {
                log::info!("Refreshing feeds...");
                Feed::refresh_all(&pool).await.unwrap();
                log::info!("Finished refreshing feeds");
            } else {
                log::info!("Skipping refresh");
            }
            tokio::time::sleep(Duration::from_secs(1800)).await;
        }
    });

    server
        .await
        .map_err(|err| AppError::Error(err.to_string()))?;

    Ok(())
}
