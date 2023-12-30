use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, patch, post},
    Json, Router,
};
use axum_login::login_required;
use serde::Deserialize;

use crate::{
    auth::{get_user, AuthSession, Backend, Credentials},
    error::AppError,
    rss::Feed as SynFeed,
    state::AppState,
    types::{
        AddFeedRequest, AddGroupFeedRequest, Article, ArticleId,
        ArticleMarkRequest, ArticleSummary, ArticlesMarkRequest,
        CreateFeedGroupRequest, CreateUserRequest, Feed, FeedGroup,
        FeedGroupId, FeedGroupWithFeeds, FeedId, FeedLog, FeedStat, FeedStats,
        UpdateFeedRequest, User,
    },
};

pub(crate) async fn login(
    mut auth_session: AuthSession,
    Json(creds): Json<Credentials>,
) -> Result<Json<User>, AppError> {
    let user = match auth_session.authenticate(creds.clone()).await {
        Ok(Some(user)) => Ok(user),
        Ok(None) => Err(AppError::Error("Invalid username or password".into())),
        Err(err) => {
            Err(AppError::Error(format!("Error logging in user: {err}")))
        }
    }?;

    auth_session
        .login(&user)
        .await
        .map_err(|_| AppError::Error("Error logging in user".into()))?;

    Ok(Json(user.user))
}

pub(crate) async fn logout(
    mut auth_session: AuthSession,
) -> Result<(), AppError> {
    let _ = auth_session.logout().await?;
    Ok(())
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
    state: State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    Ok(Json(User::get_all(&state.pool).await?))
}

pub(crate) async fn get_session_user(
    auth_session: AuthSession,
) -> Result<Json<User>, AppError> {
    let user = get_user(&auth_session)?;
    log::debug!("session user ID: {}", user.id);
    Ok(Json(user))
}

#[derive(Deserialize)]
pub struct ArticlesQuery {
    saved: Option<bool>,
}

pub(crate) async fn get_articles(
    auth_session: AuthSession,
    state: State<AppState>,
    Query(query): Query<ArticlesQuery>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let user = get_user(&auth_session)?;
    let articles = user.articles(&state.pool).await?;
    let articles = if query.saved.unwrap_or(false) {
        articles.into_iter().filter(|a| a.saved).collect()
    } else {
        articles
    };
    Ok(Json(articles))
}

pub(crate) async fn get_article(
    state: State<AppState>,
    Path(id): Path<ArticleId>,
) -> Result<Json<Article>, AppError> {
    let article = Article::get(&state.pool, &id).await?;
    Ok(Json(article))
}

pub(crate) async fn mark_article(
    auth_session: AuthSession,
    state: State<AppState>,
    Path(id): Path<ArticleId>,
    Json(body): Json<ArticleMarkRequest>,
) -> Result<(), AppError> {
    log::info!("marking {} as {:?}", id, body);
    let user = get_user(&auth_session)?;
    let article = Article::get(&state.pool, &id).await?;
    article.mark(&state.pool, &user.id, &body).await?;
    log::info!("marked {}", id);
    Ok(())
}

pub(crate) async fn mark_articles(
    auth_session: AuthSession,
    state: State<AppState>,
    Json(body): Json<ArticlesMarkRequest>,
) -> Result<(), AppError> {
    let user = get_user(&auth_session)?;
    Article::mark_all(&state.pool, &user.id, &body).await?;
    Ok(())
}

pub(crate) async fn get_feed_articles(
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let feed = Feed::get(&state.pool, &id).await?;
    Ok(Json(feed.articles(&state.pool).await?))
}

pub(crate) async fn add_feed(
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
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    Feed::delete(&state.pool, &id).await?;
    Ok(())
}

pub(crate) async fn update_feed(
    state: State<AppState>,
    Path(id): Path<FeedId>,
    Json(body): Json<UpdateFeedRequest>,
) -> Result<(), AppError> {
    let mut feed = Feed::get(&state.pool, &id).await?;
    feed.update(&state.pool, body).await?;
    Ok(())
}

pub(crate) async fn get_feed(
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Feed>, AppError> {
    log::debug!("getting feed {}", id);
    Ok(Json(Feed::get(&state.pool, &id).await?))
}

pub(crate) async fn get_feeds(
    state: State<AppState>,
) -> Result<Json<Vec<Feed>>, AppError> {
    Ok(Json(Feed::get_all(&state.pool).await?))
}

pub(crate) async fn refresh_feed(
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    let feed = Feed::get(&state.pool, &id).await?;
    log::debug!("refreshing feed at {}", feed.url);
    feed.refresh(&state.pool).await?;
    Ok(())
}

pub(crate) async fn refresh_feeds(
    state: State<AppState>,
) -> Result<(), AppError> {
    log::debug!("refreshing all feeds");
    Feed::refresh_all(&state.pool).await?;
    Ok(())
}

pub(crate) async fn get_feed_log(
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    Ok(Json(FeedLog::find_for_feed(&state.pool, id).await?))
}

pub(crate) async fn get_all_feed_logs(
    state: State<AppState>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    Ok(Json(FeedLog::get_all(&state.pool).await?))
}

pub(crate) async fn create_feed_group(
    auth_session: AuthSession,
    state: State<AppState>,
    Json(body): Json<CreateFeedGroupRequest>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let user = get_user(&auth_session)?;
    let group = FeedGroup::create(&state.pool, body.name, user.id).await?;
    Ok(Json(FeedGroupWithFeeds {
        id: group.id,
        name: group.name,
        user_id: group.user_id,
        feed_ids: vec![],
    }))
}

pub(crate) async fn get_feed_group(
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
    state: State<AppState>,
    Path((id, feed_id)): Path<(FeedGroupId, FeedId)>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let group = FeedGroup::get(&state.pool, &id).await?;
    group.remove_feed(&state.pool, &feed_id).await?;
    Ok(Json(group.with_feeds(&state.pool).await?))
}

pub(crate) async fn get_feed_group_articles(
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let group = FeedGroup::get(&state.pool, &id).await?;
    Ok(Json(group.articles(&state.pool).await?))
}

pub(crate) async fn get_feed_stat(
    auth_session: AuthSession,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<FeedStat>, AppError> {
    let user = get_user(&auth_session)?;
    let feed = Feed::get(&state.pool, &id).await?;
    Ok(Json(feed.stats(&state.pool, &user.id).await?))
}

#[derive(Deserialize)]
pub(crate) struct GetFeedStatsQuery {
    pub(crate) all: Option<bool>,
}

pub(crate) async fn get_feed_stats(
    auth_session: AuthSession,
    state: State<AppState>,
    Query(query): Query<GetFeedStatsQuery>,
) -> Result<Json<FeedStats>, AppError> {
    let user = get_user(&auth_session)?;
    let feeds = if query.all.unwrap_or(false) {
        Feed::get_all(&state.pool).await?
    } else {
        Feed::get_subscribed(&state.pool, &user.id).await?
    };
    let mut stats = FeedStats::new();
    for feed in feeds.iter() {
        stats.insert(
            feed.id.clone(),
            Some(feed.stats(&state.pool, &user.id).await?),
        );
    }
    Ok(Json(stats))
}

pub(crate) fn get_router() -> Router<AppState> {
    Router::new()
        .route("/me", get(get_session_user))
        .route("/users", post(create_user))
        .route("/users", get(get_users))
        .route("/logout", get(logout))
        .route("/articles", get(get_articles))
        .route("/articles", patch(mark_articles))
        .route("/articles/:id", get(get_article))
        .route("/articles/:id", patch(mark_article))
        .route("/feeds/log", get(get_all_feed_logs))
        .route("/feeds/refresh", get(refresh_feeds))
        .route("/feeds/:id/refresh", get(refresh_feed))
        .route("/feeds/:id/articles", get(get_feed_articles))
        .route("/feeds/:id/log", get(get_feed_log))
        .route("/feeds/:id/stats", get(get_feed_stat))
        .route("/feeds/:id", get(get_feed))
        .route("/feeds/:id", delete(delete_feed))
        .route("/feeds/:id", patch(update_feed))
        .route("/feeds", get(get_feeds))
        .route("/feeds", post(add_feed))
        .route("/feedgroups", get(get_all_feed_groups))
        .route("/feedgroups", post(create_feed_group))
        .route("/feedgroups/:id", get(get_feed_group))
        .route("/feedgroups/:id", post(add_group_feed))
        .route("/feedgroups/:id/articles", get(get_feed_group_articles))
        .route("/feedgroups/:id/:feed_id", delete(remove_group_feed))
        .route("/feedstats", get(get_feed_stats))
        .route_layer(login_required!(Backend))
        .route("/login", post(login))
}
