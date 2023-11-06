use axum::{
    extract::{Path, Query, State},
    http::Uri,
    response::{Html, IntoResponse, Redirect},
    Form, Json,
};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use handlebars::Handlebars;
use log::info;
use reqwest::{header, StatusCode};
use rust_embed::RustEmbed;
use serde::Deserialize;
use serde_json::json;
use sqlx::SqliteConnection;

use crate::{
    error::AppError,
    rss::load_feed,
    state::AppState,
    templates::get_template,
    types::{
        AddFeedRequest, AddGroupFeedRequest, Article, ArticleId,
        ArticleMarkRequest, ArticleSummary, ArticlesMarkRequest,
        CreateFeedGroupRequest, CreateSessionRequest, CreateUserRequest, Feed,
        FeedGroup, FeedGroupId, FeedGroupWithFeeds, FeedId, FeedLog, FeedStats,
        Password, Session, UpdateFeedRequest, User, FeedStat,
    },
    util::{add_cache_control, check_password},
};

pub(crate) async fn create_user(
    state: State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    let mut tx = state.pool.begin().await?;

    let user = User::create(&mut *tx, body.email, body.username).await?;
    Password::create(&mut *tx, &body.password, &user.id).await?;

    tx.commit().await?;

    Ok(Json(user))
}

pub(crate) async fn get_users(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let users = User::get_all(&mut conn).await?;
    Ok(Json(users))
}

pub(crate) async fn get_session_user(
    session: Session,
    state: State<AppState>,
) -> Result<Json<User>, AppError> {
    let mut conn = state.pool.acquire().await?;
    log::debug!("session user ID: {}", session.user_id);
    let user = User::get(&mut conn, session.user_id).await?;
    Ok(Json(user))
}

async fn create_session_impl(
    conn: &mut SqliteConnection,
    jar: CookieJar,
    data: &CreateSessionRequest,
) -> Result<(CookieJar, Session), AppError> {
    let user = User::get_by_username(conn, &data.username).await?;
    let password = Password::get_by_user_id(conn, &user.id).await?;
    check_password(&data.password, &password.hash, &password.salt)?;
    let session = Session::create(conn, user.id).await?;

    Ok((
        jar.add(Cookie::new("session_id", session.id.to_string())),
        session,
    ))
}

pub(crate) async fn create_session(
    state: State<AppState>,
    jar: CookieJar,
    Json(body): Json<CreateSessionRequest>,
) -> Result<(CookieJar, Json<Session>), AppError> {
    info!("Logging in user {}", body.username);

    let mut conn = state.pool.acquire().await?;
    let (jar, session) =
        create_session_impl(&mut conn, jar.clone(), &body).await?;

    Ok((jar, Json(session)))
}

pub(crate) async fn get_articles(
    session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let user = User::get(&mut conn, session.user_id).await?;
    Ok(Json(user.articles(&mut conn).await?))
}

pub(crate) async fn get_article(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<ArticleId>,
) -> Result<Json<Article>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let article = Article::get(&mut *conn, &id).await?;
    Ok(Json(article))
}

pub(crate) async fn mark_article(
    session: Session,
    state: State<AppState>,
    Path(id): Path<ArticleId>,
    Json(body): Json<ArticleMarkRequest>,
) -> Result<(), AppError> {
    let mut conn = state.pool.acquire().await?;
    let article = Article::get(&mut conn, &id).await?;
    article.mark(&mut conn, session.user_id, &body).await?;
    Ok(())
}

pub(crate) async fn mark_articles(
    session: Session,
    state: State<AppState>,
    Json(body): Json<ArticlesMarkRequest>,
) -> Result<(), AppError> {
    let mut tx = state.pool.begin().await?;
    Article::mark_all(&mut *tx, &session.user_id, &body).await?;
    tx.commit().await?;
    Ok(())
}

pub(crate) async fn get_feed_articles(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let feed = Feed::get(&mut conn, &id).await?;
    Ok(Json(feed.articles(&mut conn).await?))
}

pub(crate) async fn add_feed(
    _session: Session,
    state: State<AppState>,
    Json(body): Json<AddFeedRequest>,
) -> Result<(), AppError> {
    log::debug!("adding feed with {:?}", body);
    let mut conn = state.pool.acquire().await?;
    let feed = load_feed(body.url.as_str()).await?;
    let title = feed.title.map_or(body.url.to_string(), |t| t.content);
    Feed::create(&mut conn, body.url, &title, body.kind).await?;
    Ok(())
}

pub(crate) async fn delete_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    let mut conn = state.pool.acquire().await?;
    Feed::delete(&mut conn, &id).await?;
    Ok(())
}

pub(crate) async fn update_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
    Json(body): Json<UpdateFeedRequest>,
) -> Result<(), AppError> {
    let mut conn = state.pool.acquire().await?;
    let mut feed = Feed::get(&mut conn, &id).await?;
    feed.update(&mut conn, body).await?;
    Ok(())
}

pub(crate) async fn get_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Feed>, AppError> {
    log::debug!("getting feed {}", id);
    let mut conn = state.pool.acquire().await?;
    let feed = Feed::get(&mut conn, &id).await?;
    Ok(Json(feed))
}

pub(crate) async fn get_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<Feed>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let feeds = Feed::get_all(&mut conn).await?;
    Ok(Json(feeds))
}

pub(crate) async fn refresh_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    let mut tx = state.pool.begin().await?;
    let feed = Feed::get(&mut *tx, &id).await?;
    log::debug!("refreshing feed at {}", feed.url);
    feed.refresh(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

pub(crate) async fn refresh_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<(), AppError> {
    let mut tx = state.pool.begin().await?;
    log::debug!("refreshing all feeds");
    Feed::refresh_all(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

pub(crate) async fn get_feed_log(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let logs = FeedLog::find_for_feed(&mut conn, id).await?;
    Ok(Json(logs))
}

pub(crate) async fn get_all_feed_logs(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let logs = FeedLog::get_all(&mut conn).await?;
    Ok(Json(logs))
}

pub(crate) async fn create_feed_group(
    session: Session,
    state: State<AppState>,
    Json(body): Json<CreateFeedGroupRequest>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let user_id = session.user_id;
    let group = FeedGroup::create(&mut conn, body.name, user_id).await?;
    Ok(Json(FeedGroupWithFeeds {
        id: group.id,
        name: group.name,
        user_id: group.user_id,
        feed_ids: vec![],
    }))
}

pub(crate) async fn get_feed_group(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let group = FeedGroup::get(&mut conn, &id)
        .await?
        .with_feeds(&mut conn)
        .await?;
    Ok(Json(group))
}

pub(crate) async fn get_all_feed_groups(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedGroupWithFeeds>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let groups: Vec<FeedGroup> = FeedGroup::get_all(&mut conn).await?;
    let mut groups_with_feeds: Vec<FeedGroupWithFeeds> = vec![];
    for group in groups {
        let group_with_feeds = group.with_feeds(&mut conn).await?;
        groups_with_feeds.push(group_with_feeds);
    }
    Ok(Json(groups_with_feeds))
}

pub(crate) async fn add_group_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
    Json(body): Json<AddGroupFeedRequest>,
) -> Result<(), AppError> {
    let mut tx = state.pool.begin().await?;
    let group = FeedGroup::get(&mut tx, &id).await?;
    if body.move_feed.unwrap_or(false) {
        group.move_feed(&mut tx, body.feed_id).await?;
    } else {
        group.add_feed(&mut tx, body.feed_id).await?;
    }
    tx.commit().await?;
    Ok(())
}

pub(crate) async fn remove_group_feed(
    _session: Session,
    state: State<AppState>,
    Path((id, feed_id)): Path<(FeedGroupId, FeedId)>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let group = FeedGroup::get(&mut conn, &id).await?;
    group.remove_feed(&mut conn, &feed_id).await?;
    Ok(Json(group.with_feeds(&mut conn).await?))
}

pub(crate) async fn get_feed_group_articles(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let group = FeedGroup::get(&mut conn, &id).await?;
    Ok(Json(group.articles(&mut conn).await?))
}

#[derive(Deserialize)]
pub(crate) struct GetFeedStatsParams {
    pub(crate) all: Option<bool>,
}

pub(crate) async fn get_feed_stat(
    session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<FeedStat>, AppError> {
    let mut conn = state.pool.acquire().await?;
    println!("getting stats for {}", id);
    let feed = Feed::get(&mut conn, &id).await?;
    Ok(Json(feed.stats(&mut conn, &session.user_id).await?))
}

pub(crate) async fn get_feed_stats(
    session: Session,
    state: State<AppState>,
    Query(query): Query<GetFeedStatsParams>,
) -> Result<Json<FeedStats>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let feeds = if query.all.unwrap_or(false) {
        Feed::get_all(&mut conn).await?
    } else {
        Feed::get_subscribed(&mut conn, &session.user_id).await?
    };
    let mut stats = FeedStats::new();
    for feed in feeds.iter() {
        stats.feeds.insert(
            feed.id.clone(),
            Some(feed.stats(&mut conn, &session.user_id).await?),
        );
    }
    Ok(Json(stats))
}

/// Clear any current session and display the login page
pub(crate) async fn show_login_page(
    jar: CookieJar,
) -> Result<(CookieJar, Html<String>), AppError> {
    let jar = jar.remove(Cookie::named("session_id"));
    let login_tmpl = get_template("login.html")?;
    let renderer = Handlebars::new();
    let login_page = renderer.render_template(&login_tmpl, &json!({}))?;
    Ok((jar, Html(login_page)))
}

/// Handle login form submission
pub(crate) async fn login(
    state: State<AppState>,
    jar: CookieJar,
    Form(login): Form<CreateSessionRequest>,
) -> Result<(CookieJar, Redirect), AppError> {
    let mut conn = state.pool.acquire().await?;
    let (jar, _session) =
        create_session_impl(&mut conn, jar.clone(), &login).await?;
    Ok((jar, Redirect::to("/reader")))
}

#[derive(RustEmbed)]
#[folder = "public/"]
struct Public;

pub(crate) async fn public_files(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');
    if let Some(content) = Public::get(path) {
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        add_cache_control(
            ([(header::CONTENT_TYPE, mime.as_ref())], content.data)
                .into_response(),
        )
    } else {
        (StatusCode::NOT_FOUND, "404").into_response()
    }
}
