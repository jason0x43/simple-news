use axum::{
    http::{header::CONTENT_TYPE, StatusCode, Uri},
    response::{Html, IntoResponse, Redirect, Response},
    Form, extract::Query,
};
use handlebars::Handlebars;
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    auth::{AuthSession, Credentials},
    error::AppError,
    templates::get_template,
    util::add_cache_control,
};

pub(crate) async fn root() -> Result<Redirect, AppError> {
    Ok(Redirect::to("/login"))
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Next {
    pub(crate) next: Option<String>
}

/// Clear any current session and display the login page
pub(crate) async fn login_page(
    mut auth_session: AuthSession,
    Query(next): Query<Next>,
) -> Result<Html<String>, AppError> {
    let _ = auth_session.logout().await;
    let login_tmpl = get_template("login.html")?;
    let renderer = Handlebars::new();
    let login_page = renderer.render_template(&login_tmpl, &next)?;
    Ok(Html(login_page))
}

/// Handle login form submission
pub(crate) async fn login_form(
    mut auth_session: AuthSession,
    Form(creds): Form<Credentials>,
) -> Result<Response, AppError> {
    let user = match auth_session.authenticate(creds.clone()).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            let login_tmpl = get_template("login.html")?;
            let renderer = Handlebars::new();
            let login_page =
                renderer.render_template(&login_tmpl, &json!({}))?;
            return Ok(Html(login_page).into_response());
        }
        Err(_) => {
            return Err(AppError::Error("Invalid username or password".into()))
        }
    };

    auth_session
        .login(&user)
        .await
        .map_err(|_| AppError::Error("Error logging in user".into()))?;

    if let Some(ref next) = creds.next {
        Ok(Redirect::to(next).into_response())
    } else {
        Ok(Redirect::to("/reader").into_response())
    }
}

#[derive(RustEmbed)]
#[folder = "public/"]
struct Public;

pub(crate) async fn public_files(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');
    if let Some(content) = Public::get(path) {
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        add_cache_control(
            ([(CONTENT_TYPE, mime.as_ref())], content.data).into_response(),
        )
    } else {
        (StatusCode::NOT_FOUND, "404").into_response()
    }
}
