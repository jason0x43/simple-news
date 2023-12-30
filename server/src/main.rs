mod api;
mod auth;
mod db;
mod error;
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
    error_handling::HandleErrorLayer,
    http::{header, request::Parts as RequestParts, HeaderValue, StatusCode},
    routing::{get, post},
    Router,
};
use dotenvy::dotenv;
use error::AppError;
use log::info;
use sqlx::{migrate, query, sqlite::SqlitePoolOptions};
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    cors::{AllowOrigin, CorsLayer},
    trace::TraceLayer,
};

use crate::{
    auth::create_auth_layer,
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

    // The error handling layer is required since AuthManagerLayer is fallible
    let auth_service = ServiceBuilder::new()
        .layer(HandleErrorLayer::new(|_| async { StatusCode::BAD_REQUEST }))
        .layer(create_auth_layer(&pool).await?);

    let app = Router::new()
        .route("/login", get(handlers::login_page))
        .route("/login", post(handlers::login_form))
        .nest("/api", api::get_router())
        .nest("/reader", spa::get_router())
        .route("/", get(handlers::root))
        .fallback(handlers::public_files)
        .with_state(AppState { pool: pool.clone() })
        .layer(auth_service)
        .layer(CompressionLayer::new());

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
