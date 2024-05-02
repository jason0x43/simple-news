mod db;
mod error;
mod extractors;
mod handlers;
mod rss;
mod state;
mod types;
mod types_ts;
mod util;

use std::time::Duration;

use axum::{
    http::{header, request::Parts as RequestParts, HeaderValue},
    Router,
};
use dotenvy::dotenv;
use error::AppError;
use log::info;
use sqlx::{migrate, postgres::PgPoolOptions, query, PgPool};
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    trace::TraceLayer,
};
use types::User;

use crate::{
    state::AppState,
    types::{Feed, FeedLog},
    util::get_timestamp,
};

type DbPool = PgPool;
type DbPoolOptions = PgPoolOptions;

async fn run_migrations(pool: &DbPool) -> Result<(), AppError> {
    migrate!("../server/migrations").run(pool).await?;

    let latest_migration = query!(
        r#"
        SELECT description
        FROM _sqlx_migrations
        WHERE success = TRUE
        ORDER BY installed_on DESC
        LIMIT 1
        "#,
    )
    .fetch_one(pool)
    .await?;

    info!(
        "Latest applied migration is '{}'",
        latest_migration.description
    );

    Ok(())
}

async fn create_admin_user(pool: &DbPool) -> Result<(), AppError> {
    let user =
        std::env::var("SN_ADMIN_USER").expect("SN_ADMIN_USER must be set.");
    let pass = std::env::var("SN_ADMIN_PASSWORD")
        .expect("SN_ADMIN_PASSWORD must be set.");
    let admin = User::get_by_username(pool, &user).await;

    if admin.is_ok() {
        log::info!("Admin user {user} already exists");
        Ok(())
    } else {
        User::create(pool, &user, &user, &pass).await?;
        log::info!("Created admin user {user}");
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), AppError> {
    dotenv().ok();

    tracing_subscriber::fmt::init();

    let db_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set.");

    log::info!("Connecting to database at {db_url}");

    let pool = DbPoolOptions::new()
        .max_connections(20)
        .connect(&db_url)
        .await?;

    run_migrations(&pool).await?;
    create_admin_user(&pool).await?;

    let app = Router::new()
        .nest("/api", handlers::get_router())
        .with_state(AppState { pool: pool.clone() });

    let cors_enabled =
        std::env::var("CORS_ENABLED").unwrap_or("0".into()) == "1";
    let app = if cors_enabled {
        app.layer(
            CorsLayer::new()
                .allow_origin(AllowOrigin::predicate(
                    |_origin: &HeaderValue, _request_parts: &RequestParts| true,
                ))
                .allow_credentials(true)
                .allow_headers(vec![header::CONTENT_TYPE]),
        )
    } else {
        app
    };

    let app = app.layer(TraceLayer::new_for_http());
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3333").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let server = axum::serve(listener, app);

    info!("Listening on {}...", addr);

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
