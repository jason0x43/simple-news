mod api;
mod spa;

use axum::{routing::get, Router, ServiceExt};
use tower_http::normalize_path::NormalizePath;

use crate::{api::get_articles, spa::static_handler};

#[tokio::main]
async fn main() {
    let app = NormalizePath::trim_trailing_slash(
        Router::new()
            .route("/articles", get(get_articles))
            .fallback(static_handler),
    );

    let server = axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service());

    println!("Listening on {}...", server.local_addr());
    server.await.unwrap();
}
