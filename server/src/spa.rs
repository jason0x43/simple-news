use axum::{
    http::{header, StatusCode, Uri},
    response::{Html, IntoResponse, Response},
};
use rust_embed::RustEmbed;

use crate::{types::Session, util::add_cache_control};

#[derive(RustEmbed)]
#[folder = "../app/dist/"]
struct Assets;

static INDEX_HTML: &str = "index.html";

pub(crate) async fn spa_handler(
    _session: Session,
    uri: Uri,
) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');

    if path.is_empty() || path == INDEX_HTML {
        return index_html().await;
    }

    match Assets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            add_cache_control(
                ([(header::CONTENT_TYPE, mime.as_ref())], content.data)
                    .into_response(),
            )
        }
        None => {
            println!("sending index");
            index_html().await
        }
    }
}

pub(crate) async fn index_html() -> Response {
    match Assets::get(INDEX_HTML) {
        Some(content) => add_cache_control(Html(content.data).into_response()),
        None => not_found().await,
    }
}

async fn not_found() -> Response {
    println!("sending not found");
    (StatusCode::NOT_FOUND, "404").into_response()
}
