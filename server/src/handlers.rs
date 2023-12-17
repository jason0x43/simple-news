use axum::{
    extract::{Path, Query, State},
    http::Uri,
    response::{Html, IntoResponse, Redirect, Response},
    Form, Json,
};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use handlebars::Handlebars;
use log::info;
use reqwest::{header, StatusCode};
use rust_embed::RustEmbed;
use serde::Deserialize;
use serde_json::json;
use sqlx::SqlitePool;
use time::Duration;

use crate::{
    error::AppError,
    rss::Feed as SynFeed,
    state::AppState,
    templates::get_template,
    types::{
        AddFeedRequest, AddGroupFeedRequest, Article, ArticleId,
        ArticleMarkRequest, ArticleSummary, ArticlesMarkRequest,
        CreateFeedGroupRequest, CreateSessionRequest, CreateUserRequest, Feed,
        FeedGroup, FeedGroupId, FeedGroupWithFeeds, FeedId, FeedLog, FeedStat,
        FeedStats, Session, UpdateFeedRequest, User,
    },
    util::add_cache_control,
};

pub(crate) async fn root() -> Result<Redirect, AppError> {
    Ok(Redirect::to("/login"))
}

pub(crate) async fn create_user(
    state: State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    Ok(Json(
        User::create(&state.pool, &body.email, &body.username, &body.password)
            .await?,
    ))
}

pub(crate) async fn get_users(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    Ok(Json(User::get_all(&state.pool).await?))
}

pub(crate) async fn get_session_user(
    session: Session,
    state: State<AppState>,
) -> Result<Json<User>, AppError> {
    log::debug!("session user ID: {}", session.user_id);
    Ok(Json(User::get(&state.pool, session.user_id).await?))
}

async fn create_session_impl(
    pool: &SqlitePool,
    jar: CookieJar,
    data: &CreateSessionRequest,
) -> Result<(CookieJar, Session), AppError> {
    let user = User::get_by_username(pool, &data.username).await?;
    user.check_password(pool, &data.password).await?;
    let session = Session::create(pool, user.id).await?;

    Ok((
        jar.add(
            Cookie::build("session_id", session.id.to_string())
                .max_age(Duration::days(14))
                .finish(),
        ),
        session,
    ))
}

pub(crate) async fn create_session(
    state: State<AppState>,
    jar: CookieJar,
    Json(body): Json<CreateSessionRequest>,
) -> Result<(CookieJar, Json<Session>), AppError> {
    info!("Logging in user {}", body.username);

    let (jar, session) =
        create_session_impl(&state.pool, jar.clone(), &body).await?;

    Ok((jar, Json(session)))
}

#[derive(Deserialize)]
pub struct ArticlesQuery {
    saved: Option<bool>,
}

pub(crate) async fn get_articles(
    session: Session,
    state: State<AppState>,
    Query(query): Query<ArticlesQuery>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let user = User::get(&state.pool, session.user_id).await?;
    let articles = user.articles(&state.pool).await?;
    let articles = if query.saved.unwrap_or(false) {
        articles.into_iter().filter(|a| a.saved).collect()
    } else {
        articles
    };
    Ok(Json(articles))
}

pub(crate) async fn get_article(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<ArticleId>,
) -> Result<Json<Article>, AppError> {
    let article = Article::get(&state.pool, &id).await?;
    Ok(Json(article))
}

pub(crate) async fn mark_article(
    session: Session,
    state: State<AppState>,
    Path(id): Path<ArticleId>,
    Json(body): Json<ArticleMarkRequest>,
) -> Result<(), AppError> {
    log::info!("marking {} as {:?}", id, body);
    let article = Article::get(&state.pool, &id).await?;
    article.mark(&state.pool, &session.user_id, &body).await?;
    log::info!("marked {}", id);
    Ok(())
}

pub(crate) async fn mark_articles(
    session: Session,
    state: State<AppState>,
    Json(body): Json<ArticlesMarkRequest>,
) -> Result<(), AppError> {
    Article::mark_all(&state.pool, &session.user_id, &body).await?;
    Ok(())
}

pub(crate) async fn get_feed_articles(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let feed = Feed::get(&state.pool, &id).await?;
    Ok(Json(feed.articles(&state.pool).await?))
}

pub(crate) async fn add_feed(
    _session: Session,
    state: State<AppState>,
    Json(body): Json<AddFeedRequest>,
) -> Result<(), AppError> {
    log::debug!("adding feed with {:?}", body);
    let feed = SynFeed::load(body.url.as_str()).await?;
    let title = feed.title;
    Feed::create(&state.pool, body.url, &title, body.kind).await?;
    Ok(())
}

pub(crate) async fn delete_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    Feed::delete(&state.pool, &id).await?;
    Ok(())
}

pub(crate) async fn update_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
    Json(body): Json<UpdateFeedRequest>,
) -> Result<(), AppError> {
    let mut feed = Feed::get(&state.pool, &id).await?;
    feed.update(&state.pool, body).await?;
    Ok(())
}

pub(crate) async fn get_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Feed>, AppError> {
    log::debug!("getting feed {}", id);
    Ok(Json(Feed::get(&state.pool, &id).await?))
}

pub(crate) async fn get_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<Feed>>, AppError> {
    Ok(Json(Feed::get_all(&state.pool).await?))
}

pub(crate) async fn refresh_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    let feed = Feed::get(&state.pool, &id).await?;
    log::debug!("refreshing feed at {}", feed.url);
    feed.refresh(&state.pool).await?;
    Ok(())
}

pub(crate) async fn refresh_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<(), AppError> {
    log::debug!("refreshing all feeds");
    Feed::refresh_all(&state.pool).await?;
    Ok(())
}

pub(crate) async fn get_feed_log(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    Ok(Json(FeedLog::find_for_feed(&state.pool, id).await?))
}

pub(crate) async fn get_all_feed_logs(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    Ok(Json(FeedLog::get_all(&state.pool).await?))
}

pub(crate) async fn create_feed_group(
    session: Session,
    state: State<AppState>,
    Json(body): Json<CreateFeedGroupRequest>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let user_id = session.user_id;
    let group = FeedGroup::create(&state.pool, body.name, user_id).await?;
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
    Ok(Json(
        FeedGroup::get(&state.pool, &id)
            .await?
            .with_feeds(&state.pool)
            .await?,
    ))
}

pub(crate) async fn get_all_feed_groups(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedGroupWithFeeds>>, AppError> {
    let groups: Vec<FeedGroup> = FeedGroup::get_all(&state.pool).await?;
    let mut groups_with_feeds: Vec<FeedGroupWithFeeds> = vec![];
    for group in groups {
        let group_with_feeds = group.with_feeds(&state.pool).await?;
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
    let group = FeedGroup::get(&state.pool, &id).await?;
    if body.move_feed.unwrap_or(false) {
        group.move_feed(&state.pool, body.feed_id).await?;
    } else {
        group.add_feed(&state.pool, body.feed_id).await?;
    }
    Ok(())
}

pub(crate) async fn remove_group_feed(
    _session: Session,
    state: State<AppState>,
    Path((id, feed_id)): Path<(FeedGroupId, FeedId)>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let group = FeedGroup::get(&state.pool, &id).await?;
    group.remove_feed(&state.pool, &feed_id).await?;
    Ok(Json(group.with_feeds(&state.pool).await?))
}

pub(crate) async fn get_feed_group_articles(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let group = FeedGroup::get(&state.pool, &id).await?;
    Ok(Json(group.articles(&state.pool).await?))
}

pub(crate) async fn get_feed_stat(
    session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<FeedStat>, AppError> {
    let feed = Feed::get(&state.pool, &id).await?;
    Ok(Json(feed.stats(&state.pool, &session.user_id).await?))
}

#[derive(Deserialize)]
pub(crate) struct GetFeedStatsQuery {
    pub(crate) all: Option<bool>,
}

pub(crate) async fn get_feed_stats(
    session: Session,
    state: State<AppState>,
    Query(query): Query<GetFeedStatsQuery>,
) -> Result<Json<FeedStats>, AppError> {
    let feeds = if query.all.unwrap_or(false) {
        Feed::get_all(&state.pool).await?
    } else {
        Feed::get_subscribed(&state.pool, &session.user_id).await?
    };
    let mut stats = FeedStats::new();
    for feed in feeds.iter() {
        stats.insert(
            feed.id.clone(),
            Some(feed.stats(&state.pool, &session.user_id).await?),
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
    let (jar, _session) =
        create_session_impl(&state.pool, jar.clone(), &login).await?;
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

static WEBMANIFEST: &str = "site.webmanifest";

pub(crate) async fn webmanifest() -> Response {
    match Public::get(WEBMANIFEST) {
        Some(content) => add_cache_control(Json(content.data).into_response()),
        None => (StatusCode::NOT_FOUND, "404").into_response()
    }
}
