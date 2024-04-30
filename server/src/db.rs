use crate::{
    error::AppError,
    rss::Feed as SynFeed,
    types::{
        Article, ArticleId, ArticleMarkRequest, ArticleSummary,
        ArticlesMarkRequest, Feed, FeedGroup, FeedGroupFeed, FeedGroupFeedId,
        FeedGroupId, FeedGroupWithFeeds, FeedId, FeedKind, FeedLog, FeedLogId,
        FeedStat, FeedStats, Password, PasswordId, Session, SessionId,
        UpdateFeedRequest, User, UserArticle, UserArticleId, UserId,
    },
    util::{get_timestamp, hash_password},
};
use serde_json::json;
use sqlx::{query, query_as, SqlitePool};
use time::OffsetDateTime;
use url::Url;

impl User {
    fn new(email: &str, username: &str) -> Self {
        Self {
            id: UserId::new(),
            email: email.into(),
            username: username.into(),
            config: None,
        }
    }

    pub(crate) async fn create(
        pool: &SqlitePool,
        email: &str,
        username: &str,
        password: &str,
    ) -> Result<Self, AppError> {
        let user = Self::new(email, username);
        let password = Password::new(password, &user.id);

        let mut tx = pool.begin().await?;

        query!(
            r#"
            INSERT INTO users (id, email, username, config)
            VALUES (?1, ?2, ?3, ?4)
            "#,
            user.id,
            user.email,
            user.username,
            user.config
        )
        .execute(&mut *tx)
        .await?;

        query!(
            r#"
            INSERT INTO passwords (id, hash, salt, user_id)
            VALUES (?1, ?2, ?3, ?4)
            "#,
            password.id,
            password.hash,
            password.salt,
            password.user_id
        )
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;

        Ok(user)
    }

    pub(crate) async fn get(
        pool: &SqlitePool,
        id: &UserId,
    ) -> Result<Self, AppError> {
        query_as!(
            User,
            r#"
            SELECT
              id,
              email,
              username,
              config AS "config: serde_json::Value"
            FROM users
            WHERE id = ?1
            "#,
            id
        )
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::UserNotFound)
    }

    pub(crate) async fn get_by_username(
        pool: &SqlitePool,
        username: &str,
    ) -> Result<Self, AppError> {
        query_as!(
            User,
            r#"
            SELECT
              id,
              email,
              username,
              config AS "config: serde_json::Value"
            FROM users
            WHERE username = ?1
            "#,
            username
        )
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::UserNotFound)
    }

    pub(crate) async fn get_all(
        pool: &SqlitePool,
    ) -> Result<Vec<Self>, AppError> {
        query_as!(
            User,
            r#"
            SELECT
              id,
              email,
              username,
              config AS "config: serde_json::Value"
            FROM users
            "#
        )
        .fetch_all(pool)
        .await
        .map_err(AppError::SqlxError)
    }

    pub(crate) async fn password(
        &self,
        pool: &SqlitePool,
    ) -> Result<Password, AppError> {
        let pword = query_as!(
            Password,
            r#"
            SELECT
              id,
              hash,
              salt,
              user_id
            FROM passwords
            WHERE user_id = ?1
            "#,
            self.id
        )
        .fetch_one(pool)
        .await?;

        Ok(pword)
    }

    pub(crate) async fn articles(
        &self,
        pool: &SqlitePool,
    ) -> Result<Vec<ArticleSummary>, AppError> {
        Ok(query_as!(
            ArticleSummary,
            r#"
            SELECT
                a.id,
                a.article_id,
                a.feed_id,
                a.title,
                a.published AS "published: OffsetDateTime",
                a.link,
                read AS "read!: bool",
                saved AS "saved!: bool"
            FROM articles AS a
            INNER JOIN feeds AS f ON f.id = a.feed_id
            INNER JOIN feed_groups AS fg ON fg.user_id = ?1
            INNER JOIN feed_group_feeds AS fgf
              ON fgf.feed_id = f.id AND fgf.feed_group_id = fg.id
            LEFT JOIN user_articles AS ua
              ON ua.article_id = a.id
            WHERE ua.user_id = ?1
            ORDER BY published ASC
            "#,
            self.id
        )
        .fetch_all(pool)
        .await?)
    }

    pub(crate) async fn saved_articles(
        &self,
        pool: &SqlitePool,
    ) -> Result<Vec<ArticleSummary>, AppError> {
        Ok(query_as!(
            ArticleSummary,
            r#"
            SELECT
                a.id,
                a.article_id,
                a.feed_id,
                a.title,
                a.published AS "published: OffsetDateTime",
                a.link,
                read AS "read!: bool",
                saved AS "saved!: bool"
            FROM articles AS a
            INNER JOIN feeds AS f ON f.id = a.feed_id
            INNER JOIN feed_groups AS fg ON fg.user_id = ?1
            INNER JOIN feed_group_feeds AS fgf
              ON fgf.feed_id = f.id AND fgf.feed_group_id = fg.id
            LEFT JOIN user_articles AS ua
              ON ua.article_id = a.id
            WHERE ua.user_id = ?1 AND ua.saved = 1
            ORDER BY published ASC
            "#,
            self.id
        )
        .fetch_all(pool)
        .await?)
    }
}

impl Password {
    fn new(password: &str, user_id: &UserId) -> Self {
        let pword = hash_password(password, None);
        Self {
            id: PasswordId::new(),
            hash: pword.hash,
            salt: pword.salt,
            user_id: user_id.clone(),
        }
    }

    pub(crate) fn matches(&self, password: &str) -> Result<(), AppError> {
        let check = hash_password(password, Some(&self.salt));
        if check.hash != self.hash {
            Err(AppError::Unauthorized)
        } else {
            Ok(())
        }
    }
}

impl Session {
    pub(crate) async fn create(
        pool: &SqlitePool,
        user_id: &UserId,
    ) -> Result<Self, AppError> {
        let session = Self {
            id: SessionId::new(),
            data: json!("{}"),
            user_id: user_id.clone(),
            expires: get_timestamp(604800),
        };

        log::debug!("creating session {:?}", session);

        query!(
            r#"
            INSERT INTO sessions (id, data, user_id, expires)
            VALUES (?1, ?2, ?3, ?4)
            "#,
            session.id,
            session.data,
            session.user_id,
            session.expires
        )
        .execute(pool)
        .await?;

        Ok(session)
    }

    pub(crate) async fn get(
        pool: &SqlitePool,
        session_id: &SessionId,
    ) -> Result<Self, AppError> {
        query_as!(
            Self,
            r#"
            SELECT
              id,
              data AS "data: serde_json::Value",
              expires AS "expires!: OffsetDateTime",
              user_id
            FROM sessions
            WHERE id = ?1
            "#,
            session_id
        )
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::Unauthorized)
    }

    pub(crate) async fn delete(
        &self,
        pool: &SqlitePool,
    ) -> Result<(), AppError> {
        query!("DELETE FROM sessions WHERE id = ?1", self.id)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub(crate) async fn get_user(
        self,
        pool: &SqlitePool,
    ) -> Result<User, AppError> {
        User::get(pool, &self.user_id).await
    }
}

struct FeedStatRow {
    feed_id: FeedId,
    read: Option<i64>,
    saved: Option<i64>,
    count: i64,
}

impl Feed {
    /// Create a new feed
    pub(crate) async fn create(
        pool: &SqlitePool,
        url: Url,
        title: &str,
        kind: Option<FeedKind>,
    ) -> Result<Self, AppError> {
        let feed = Self {
            id: FeedId::new(),
            url: url.to_string(),
            title: title.into(),
            kind: kind.unwrap_or(FeedKind::Rss),
            disabled: false,
            icon: None,
            html_url: None,
        };

        query!(
            r#"
            INSERT INTO feeds (id, url, title, kind, disabled)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            feed.id,
            feed.url,
            feed.title,
            feed.kind,
            feed.disabled,
        )
        .execute(pool)
        .await
        .map_err(|err| {
            log::warn!("Error inserting feed: {}", err);
            err
        })?;

        Ok(feed)
    }

    /// Delete a feed
    pub(crate) async fn delete(
        pool: &SqlitePool,
        id: &FeedId,
    ) -> Result<(), AppError> {
        query!("DELETE FROM feeds WHERE id = ?1", id)
            .execute(pool)
            .await?;
        Ok(())
    }

    /// Update a feed's properties
    pub(crate) async fn update(
        &mut self,
        pool: &SqlitePool,
        data: UpdateFeedRequest,
    ) -> Result<(), AppError> {
        let title = data.title.unwrap_or(self.title.clone());
        let url = data.url.map_or(self.url.clone(), |u| u.to_string());

        query_as!(
            Feed,
            r#"
            UPDATE feeds SET title = ?1, url = ?2
            WHERE id = ?3
            "#,
            title,
            url,
            self.id,
        )
        .execute(pool)
        .await
        .map_err(|err| {
            log::warn!("Error updating feed: {}", err);
            err
        })?;

        self.title = title;
        self.url = url;

        Ok(())
    }

    /// Get a feed
    pub(crate) async fn get(
        pool: &SqlitePool,
        id: &FeedId,
    ) -> Result<Feed, AppError> {
        query_as!(
            Feed,
            r#"
            SELECT
              id,
              url,
              title,
              kind,
              disabled AS "disabled!: bool",
              icon,
              html_url
            FROM feeds
            WHERE id = ?1
            "#,
            id
        )
        .fetch_one(pool)
        .await
        .map_err(|err| {
            log::warn!("error getting feed {}: {}", id, err);
            AppError::SqlxError(err)
        })
    }

    /// Get all feeds
    pub(crate) async fn get_all(
        pool: &SqlitePool,
    ) -> Result<Vec<Self>, AppError> {
        query_as!(
            Feed,
            r#"
            SELECT
              id,
              url,
              title,
              kind,
              disabled AS "disabled!: bool",
              icon,
              html_url
            FROM feeds
            "#
        )
        .fetch_all(pool)
        .await
        .map_err(|err| {
            log::warn!("error loading feeds: {}", err);
            AppError::SqlxError(err)
        })
    }

    /// Refresh this feed
    pub(crate) async fn refresh(
        &self,
        pool: &SqlitePool,
    ) -> Result<(), AppError> {
        let feed = SynFeed::load(&self.url).await;
        if let Err(err) = feed {
            log::warn!("error downloading feed {}: {}", self.url, err);
            if let Some(err) = FeedLog::create(
                pool,
                self.id.clone(),
                false,
                Some(err.to_string()),
            )
            .await
            .err()
            {
                log::debug!("error creating feed update: {}", err)
            }
            return Err(err);
        }

        let mut tx = pool.begin().await?;
        let feed = feed.unwrap();
        log::debug!("downloaded feed at {}", self.url);

        let mut errors: Vec<String> = vec![];

        let icon = feed.get_icon().await;
        if let Ok(Some(icon)) = icon {
            let icon_str = icon.to_string();
            if let Some(err) = query!(
                "UPDATE feeds SET icon = ?1 WHERE id = ?2",
                icon_str,
                self.id,
            )
            .execute(&mut *tx)
            .await
            .err()
            {
                errors.push(format!("error updating icon: {}", err));
            }
        } else if let Err(err) = icon {
            log::warn!("error getting icon for {}: {}", self.url, err);
            errors.push(format!("error getting icon: {}", err));
        }

        for item in &feed.entries {
            log::debug!(
                "creating article {}, published at {}",
                item.title,
                item.published
            );
            let link: Option<Url> = item.link.clone().and_then(|link| {
                let url = Url::parse(&link);
                match url {
                    Ok(url) => Some(url),
                    Err(url::ParseError::RelativeUrlWithoutBase) => {
                        let base = Url::parse(&self.url);
                        base.map_or(None, |base| base.join(&link).ok())
                    }
                    Err(_) => None,
                }
            });

            let article = Article::new(
                item.content.clone(),
                self.id.clone(),
                item.guid.clone(),
                item.title.clone(),
                link,
                item.published,
            );

            if let Some(err) = query!(
                r#"
                INSERT INTO articles(
                  content, id, feed_id, article_id, title, link, published
                )
                VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)
                ON CONFLICT(article_id, feed_id)
                DO UPDATE
                SET content = ?1, published = ?7, title = ?5, link = ?6
                "#,
                article.content,
                article.id,
                article.feed_id,
                article.article_id,
                article.title,
                article.link,
                article.published
            )
            .execute(&mut *tx)
            .await
            .err()
            {
                errors.push(format!("error creating article: {}", err));
            }
        }

        tx.commit().await?;
        log::debug!("added articles");

        if let Some(err) = FeedLog::create(
            pool,
            self.id.clone(),
            true,
            Some(errors.join("\n")),
        )
        .await
        .err()
        {
            log::debug!("error creating feed update: {}", err)
        }

        Ok(())
    }

    /// Refresh all feeds
    pub(crate) async fn refresh_all(pool: &SqlitePool) -> Result<(), AppError> {
        let feeds = Feed::get_all(pool).await?;
        for feed in feeds.iter() {
            let id = feed.id.clone();
            feed.refresh(pool).await.unwrap_or_else(|err| {
                log::warn!("error refreshing feed {}: {}", id, err);
            })
        }

        Ok(())
    }

    /// Return the number of articles in this feed
    pub(crate) async fn article_count(
        &self,
        pool: &SqlitePool,
    ) -> Result<i32, AppError> {
        let count_row = query!(
            "SELECT COUNT(*) AS count FROM articles WHERE feed_id = ?1",
            self.id
        )
        .fetch_one(pool)
        .await?;
        Ok(count_row.count)
    }

    pub(crate) async fn articles(
        &self,
        pool: &SqlitePool,
    ) -> Result<Vec<ArticleSummary>, AppError> {
        Ok(query_as!(
            ArticleSummary,
            r#"
            SELECT
                a.id,
                a.article_id,
                feed_id,
                title,
                published AS "published: OffsetDateTime",
                link,
                read AS "read!: bool",
                saved AS "saved!: bool"
            FROM articles AS a
            LEFT OUTER JOIN user_articles
                ON user_articles.article_id = a.id
            WHERE feed_id = ?1
            ORDER BY published ASC
            "#,
            self.id
        )
        .fetch_all(pool)
        .await?)
    }

    pub(crate) async fn stats(
        &self,
        pool: &SqlitePool,
        user_id: &UserId,
    ) -> Result<FeedStat, AppError> {
        let count = self.article_count(pool).await?;
        let num_read = query!(
            r#"
            SELECT COUNT(*) AS count
            FROM user_articles AS ua
            INNER JOIN articles AS a ON a.id = ua.article_id
            WHERE ua.user_id = ?1 AND ua.read = 1 AND a.feed_id = ?2
            "#,
            user_id,
            self.id
        )
        .fetch_one(pool)
        .await?;

        let num_saved = query!(
            r#"
            SELECT COUNT(*) AS count
            FROM user_articles AS ua
            INNER JOIN articles AS a ON a.id = ua.article_id
            WHERE ua.user_id = ?1 AND ua.saved = 1 AND a.feed_id = ?2
            "#,
            user_id,
            self.id
        )
        .fetch_one(pool)
        .await?;

        Ok(FeedStat {
            total: count,
            read: num_read.count,
            saved: num_saved.count,
        })
    }

    pub(crate) async fn get_subscribed_stats(
        pool: &SqlitePool,
        user_id: &UserId,
    ) -> Result<FeedStats, AppError> {
        let rows: Vec<FeedStatRow> = query_as!(
            FeedStatRow,
            r#"
            SELECT
              f.id AS feed_id,
              ua.read AS read,
              ua.saved AS saved,
              COUNT(*) AS count
            FROM articles AS a
              INNER JOIN feeds AS f ON a.feed_id = f.id
              INNER JOIN feed_group_feeds AS fgf ON fgf.feed_id = f.id
              INNER JOIN feed_groups AS fg ON fg.id = fgf.feed_group_id
              LEFT JOIN user_articles AS ua ON ua.article_id = a.id
            WHERE fg.user_id = ?1
            GROUP BY f.id, ua.read, ua.saved
            "#,
            user_id,
        )
        .fetch_all(pool)
        .await?;

        let mut stats = FeedStats::new();

        for row in rows {
            let stat = stats.entry(row.feed_id.clone()).or_insert(FeedStat {
                total: 0,
                read: 0,
                saved: 0,
            });

            stat.total += row.count as i32;

            if row.read.unwrap_or(0) == 1 {
                stat.read += row.count as i32;
            }

            if row.saved.unwrap_or(0) == 1 {
                stat.saved += row.count as i32;
            }
        }

        Ok(stats)
    }
}

impl Article {
    pub(crate) fn new(
        content: String,
        feed_id: FeedId,
        article_id: String,
        title: String,
        link: Option<Url>,
        published: OffsetDateTime,
    ) -> Self {
        Self {
            id: ArticleId::new(),
            content,
            feed_id,
            article_id,
            title,
            link: link.map(|l| l.to_string()),
            published,
        }
    }

    pub(crate) async fn get(
        pool: &SqlitePool,
        article_id: &ArticleId,
    ) -> Result<Self, AppError> {
        Ok(query_as!(
            Article,
            r#"
            SELECT
              id,
              article_id,
              feed_id,
              title,
              content,
              published AS "published: OffsetDateTime",
              link
            FROM articles
            WHERE id = ?1
            "#,
            article_id
        )
        .fetch_one(pool)
        .await?)
    }

    pub(crate) async fn mark_all(
        pool: &SqlitePool,
        user_id: &UserId,
        data: &ArticlesMarkRequest,
    ) -> Result<i32, AppError> {
        let mut tx = pool.begin().await?;
        for id in &data.article_ids {
            let ua = UserArticle::new(
                user_id.clone(),
                id.clone(),
                data.mark.read,
                data.mark.saved,
            );
            query!(
                r#"
                INSERT INTO user_articles(
                  read, saved, id, user_id, article_id
                )
                VALUES(?1, ?2, ?3, ?4, ?5)
                ON CONFLICT(user_id, article_id)
                DO UPDATE SET read = ?1, saved = ?2
                "#,
                ua.read,
                ua.saved,
                ua.id,
                ua.user_id,
                ua.article_id,
            )
            .execute(&mut *tx)
            .await?;
        }
        tx.commit().await?;

        Ok(data.article_ids.len() as i32)
    }

    pub(crate) async fn mark(
        &self,
        pool: &SqlitePool,
        user_id: &UserId,
        mark: &ArticleMarkRequest,
    ) -> Result<ArticleSummary, AppError> {
        Self::mark_all(
            pool,
            user_id,
            &ArticlesMarkRequest {
                article_ids: vec![self.id.clone()],
                mark: mark.clone(),
            },
        )
        .await?;

        let a = self.clone();
        let a_mark = query!(
            r#"
            SELECT
              read AS "read!: bool",
              saved AS "saved!: bool"
            FROM user_articles
            WHERE user_id = ?1 AND article_id = ?2
            "#,
            user_id,
            self.id,
        )
        .fetch_one(pool)
        .await?;

        Ok(ArticleSummary {
            id: a.id,
            article_id: a.article_id,
            feed_id: a.feed_id,
            title: a.title,
            published: a.published,
            link: a.link,
            read: a_mark.read,
            saved: a_mark.saved,
        })
    }
}

impl FeedLog {
    pub(crate) async fn create(
        pool: &SqlitePool,
        feed_id: FeedId,
        success: bool,
        message: Option<String>,
    ) -> Result<Self, AppError> {
        let entry = FeedLog {
            id: FeedLogId::new(),
            time: get_timestamp(0),
            feed_id,
            success,
            message,
        };

        query!(
            r#"
            INSERT INTO feed_logs(id, time, feed_id, success, message)
            VALUES(?1, ?2, ?3, ?4, ?5)
            "#,
            entry.id,
            entry.time,
            entry.feed_id,
            entry.success,
            entry.message,
        )
        .execute(pool)
        .await?;

        Ok(entry)
    }

    pub(crate) async fn find_for_feed(
        pool: &SqlitePool,
        feed_id: FeedId,
    ) -> Result<Vec<Self>, AppError> {
        query_as!(
            FeedLog,
            r#"
            SELECT
              id,
              time AS "time!: OffsetDateTime",
              feed_id,
              success AS "success!: bool",
              message
            FROM feed_logs
            WHERE feed_id = ?1
            "#,
            feed_id
        )
        .fetch_all(pool)
        .await
        .map_err(AppError::SqlxError)
    }

    pub(crate) async fn get_all(
        pool: &SqlitePool,
    ) -> Result<Vec<Self>, AppError> {
        query_as!(
            FeedLog,
            r#"
            SELECT
              id,
              time AS "time!: OffsetDateTime",
              feed_id,
              success AS "success!: bool",
              message
            FROM feed_logs
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(AppError::SqlxError)
    }

    pub(crate) async fn last_update(
        pool: &SqlitePool,
    ) -> Result<OffsetDateTime, AppError> {
        let latest = query_as!(
            FeedLog,
            r#"
            SELECT
              id,
              time AS "time!: OffsetDateTime",
              feed_id,
              success AS "success!: bool",
              message
            FROM feed_logs
            WHERE success = 1
            ORDER BY time DESC
            LIMIT 1
            "#,
        )
        .fetch_one(pool)
        .await
        .map_err(AppError::SqlxError);

        if let Ok(latest) = latest {
            Ok(latest.time)
        } else {
            Ok(OffsetDateTime::from_unix_timestamp(0).unwrap())
        }
    }
}

struct FeedIdRecord {
    id: FeedId,
}

impl FeedGroup {
    /// Create a new feed group
    pub(crate) async fn create(
        pool: &SqlitePool,
        name: &str,
        user_id: &UserId,
    ) -> Result<Self, AppError> {
        let group = FeedGroup {
            id: FeedGroupId::new(),
            name: name.into(),
            user_id: user_id.clone(),
        };

        query!(
            r#"
            INSERT INTO feed_groups(id, name, user_id)
            VALUES(?1, ?2, ?3)
            "#,
            group.id,
            group.name,
            group.user_id,
        )
        .execute(pool)
        .await?;

        Ok(group)
    }

    /// Get a feed group by ID
    pub(crate) async fn get(
        pool: &SqlitePool,
        feed_group_id: &FeedGroupId,
    ) -> Result<Self, AppError> {
        query_as!(
            Self,
            r#"
            SELECT
              id,
              name,
              user_id
            FROM feed_groups
            WHERE id = ?1
            "#,
            feed_group_id
        )
        .fetch_one(pool)
        .await
        .map_err(AppError::SqlxError)
    }

    /// Get all feed groups for a user
    pub(crate) async fn get_all(
        pool: &SqlitePool,
        user_id: &UserId,
    ) -> Result<Vec<Self>, AppError> {
        query_as!(
            FeedGroup,
            r#"
            SELECT
              id,
              name,
              user_id
            FROM feed_groups
            WHERE user_id = ?1
            "#,
            user_id
        )
        .fetch_all(pool)
        .await
        .map_err(AppError::SqlxError)
    }

    /// Return a struct that describes this FeedGroup and lists its feeds
    pub(crate) async fn with_feeds(
        &self,
        pool: &SqlitePool,
    ) -> Result<FeedGroupWithFeeds, AppError> {
        let feed_ids = query_as!(
            FeedIdRecord,
            r#"
            SELECT f.id
            FROM feeds AS f
            INNER JOIN feed_group_feeds AS fgf ON f.id = fgf.feed_id
            WHERE fgf.feed_group_id = ?1
            "#,
            self.id
        )
        .fetch_all(pool)
        .await?
        .iter()
        .map(|id| id.id.clone())
        .collect();

        Ok(FeedGroupWithFeeds {
            id: self.id.clone(),
            name: self.name.clone(),
            user_id: self.user_id.clone(),
            feed_ids,
        })
    }

    /// Add a feed to this group
    pub(crate) async fn add_feed(
        &self,
        pool: &SqlitePool,
        feed_id: FeedId,
    ) -> Result<FeedGroupWithFeeds, AppError> {
        let group_feed = FeedGroupFeed::new(feed_id, self.id.clone());

        query!(
            r#"
            INSERT INTO feed_group_feeds(id, feed_id, feed_group_id)
            VALUES(?1, ?2, ?3)
            "#,
            group_feed.id,
            group_feed.feed_id,
            group_feed.feed_group_id,
        )
        .execute(pool)
        .await?;

        self.with_feeds(pool).await
    }

    /// Move a feed to this group, removing it from all other groups
    pub(crate) async fn move_feed(
        &self,
        pool: &SqlitePool,
        feed_id: FeedId,
    ) -> Result<FeedGroupWithFeeds, AppError> {
        let group_feed = FeedGroupFeed::new(feed_id.clone(), self.id.clone());

        let mut tx = pool.begin().await?;

        // remove the feed from all groups
        query!("DELETE FROM feed_group_feeds WHERE feed_id = ?1", feed_id)
            .execute(&mut *tx)
            .await?;

        // add the feed to this group
        query!(
            r#"
            INSERT INTO feed_group_feeds(id, feed_id, feed_group_id)
            VALUES(?1, ?2, ?3)
            "#,
            group_feed.id,
            group_feed.feed_id,
            group_feed.feed_group_id,
        )
        .execute(pool)
        .await?;

        tx.commit().await?;

        self.with_feeds(pool).await
    }

    /// Remove a feed from this group
    pub(crate) async fn remove_feed(
        &self,
        pool: &SqlitePool,
        feed_id: &FeedId,
    ) -> Result<FeedGroupWithFeeds, AppError> {
        query!(
            r#"
            DELETE FROM feed_group_feeds
            WHERE feed_group_id = ?1 AND feed_id = ?2
            "#,
            self.id,
            feed_id,
        )
        .execute(pool)
        .await?;

        self.with_feeds(pool).await
    }

    /// Return all the article summaries for this feed group
    pub(crate) async fn articles(
        &self,
        pool: &SqlitePool,
    ) -> Result<Vec<ArticleSummary>, AppError> {
        Ok(query_as!(
            ArticleSummary,
            r#"
            SELECT
                a.id,
                a.article_id,
                a.feed_id,
                a.title,
                a.published AS "published: OffsetDateTime",
                a.link,
                read AS "read!: bool",
                saved AS "saved!: bool"
            FROM articles AS a
            INNER JOIN feed_groups AS fg ON fg.id = ?1
            INNER JOIN feed_group_feeds AS fgf ON fgf.feed_group_id = fg.id
            INNER JOIN feeds AS f ON f.id = fgf.feed_id
            LEFT JOIN user_articles AS ua ON ua.article_id = a.id
            WHERE a.feed_id = f.id
            ORDER BY a.published ASC
            "#,
            self.id
        )
        .fetch_all(pool)
        .await?)
    }
}

impl UserArticle {
    fn new(
        user_id: UserId,
        article_id: ArticleId,
        read: Option<bool>,
        saved: Option<bool>,
    ) -> Self {
        Self {
            id: UserArticleId::new(),
            user_id,
            article_id,
            read: read.unwrap_or(false),
            saved: saved.unwrap_or(false),
        }
    }
}

impl FeedGroupFeed {
    fn new(feed_id: FeedId, feed_group_id: FeedGroupId) -> Self {
        Self {
            id: FeedGroupFeedId::new(),
            feed_id,
            feed_group_id,
        }
    }
}
