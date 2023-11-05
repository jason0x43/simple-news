use std::fs;

use crate::{
    error::AppError,
    util::{
        assert_ok, get_api, get_client, new_table, substr, to_time_str, Cache,
    },
};
use clap::{arg, ArgMatches, Command};
use comfy_table::{Cell, Color};
use reqwest::Url;
use serde::Deserialize;
use serde_json::to_string_pretty;
use server::{AddFeedRequest, Feed, FeedKind, FeedLog, FeedStats, ArticleSummary};

pub(crate) fn command() -> Command {
    Command::new("feed")
        .about("Manage feeds")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("add")
                .about("Add a feed")
                .arg(arg!(<FEEDNAME> "A name for the feed"))
                .arg(arg!(<URL> "The feed's URL"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("load")
                .about("Add feeds from a file")
                .arg(arg!(<FILE> "A JSON file containing feeds"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("delete")
                .about("Delete a feed")
                .arg(arg!(<FEED_ID> "A feed ID"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("list")
                .about("List feeds")
                .arg(arg!(-j --json "Output raw JSON"))
                .arg_required_else_help(false),
        )
        .subcommand(
            Command::new("show")
                .about("Show a feed")
                .arg(arg!(<FEED_ID> "A feed ID"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("refresh")
                .about("Refresh a feed or all feeds")
                .arg(arg!([FEED_ID] "A feed ID"))
                .arg_required_else_help(false),
        )
        .subcommand(
            Command::new("articles")
                .about("List all the articles in the given feed")
                .arg(arg!([FEED_ID] "A feed ID"))
                .arg(arg!(-j --json "Output raw JSON"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("log")
                .about("Show update log for a feed or all feeds")
                .arg(arg!([FEED_ID] "A feed ID"))
                .arg(arg!(-j --json "Output raw JSON"))
                .arg_required_else_help(false),
        )
        .subcommand(
            Command::new("stats")
                .about("Show user feed statistics")
                .arg(arg!(-j --json "Output raw JSON"))
                .arg(arg!(-a --all "Get stats for all feeds"))
                .arg_required_else_help(false),
        )
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("add", sub_matches)) => add(sub_matches).await,
        Some(("load", sub_matches)) => load(sub_matches).await,
        Some(("show", sub_matches)) => show(sub_matches).await,
        Some(("delete", sub_matches)) => delete(sub_matches).await,
        Some(("list", sub_matches)) => list(sub_matches).await,
        Some(("refresh", sub_matches)) => refresh(sub_matches).await,
        Some(("log", sub_matches)) => log(sub_matches).await,
        Some(("stats", sub_matches)) => stats(sub_matches).await,
        Some(("articles", sub_matches)) => articles(sub_matches).await,
        _ => unreachable!(),
    }
}

async fn add(matches: &ArgMatches) -> Result<(), AppError> {
    let title = matches.get_one::<String>("FEEDNAME").unwrap();
    let url = matches.get_one::<String>("URL").unwrap();
    add_feed(title, url).await
}

async fn add_feed(title: &String, url: &String) -> Result<(), AppError> {
    let url =
        Url::parse(&url).map_err(|err| AppError::Error(err.to_string()))?;
    let body = AddFeedRequest {
        title: Some(title.to_string()),
        url,
        kind: Some(FeedKind::Rss),
    };
    let client = get_client()?;
    let url = get_api()?.join("feeds")?;
    assert_ok(client.post(url.clone()).json(&body).send().await?).await?;

    println!("Added feed {} ({})", title, url);

    Ok(())
}

#[derive(Deserialize)]
struct FeedInfo {
    title: String,
    url: String,
}

async fn load(matches: &ArgMatches) -> Result<(), AppError> {
    let file = matches.get_one::<String>("FILE").unwrap();
    let json = fs::read_to_string(file)?;
    let feeds = serde_json::from_str::<Vec<FeedInfo>>(&json)?;
    for feed in feeds {
        add_feed(&feed.title, &feed.url).await?;
    }
    Ok(())
}

async fn show(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let id = matches.get_one::<String>("FEED_ID").unwrap();
    let id = cache.get_matching_id(id)?;
    let client = get_client()?;
    let url = get_api()?.join(&format!("feeds/{}", id))?;
    let resp = assert_ok(client.get(url).send().await?).await?;

    let feed: Feed = resp.json().await?;
    println!("{}", to_string_pretty(&feed).unwrap());

    Ok(())
}

async fn delete(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let id = matches.get_one::<String>("FEED_ID").unwrap();
    let id = cache.get_matching_id(id)?;
    let client = get_client()?;
    let url = get_api()?.join(&format!("feeds/{}", id))?;
    assert_ok(client.delete(url).send().await?).await?;

    Ok(())
}

async fn refresh(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let client = get_client()?;
    let id = matches.get_one::<String>("FEED_ID");
    let url = if let Some(id) = id {
        let id = cache.get_matching_id(id)?;
        get_api()?.join(&format!("feeds/{}/refresh", id))?
    } else {
        get_api()?.join("feeds/refresh")?
    };
    assert_ok(client.get(url).send().await?).await?;

    Ok(())
}

async fn list(matches: &ArgMatches) -> Result<(), AppError> {
    let client = get_client()?;
    let url = get_api()?.join("feeds")?;
    let resp = assert_ok(client.get(url).send().await?).await?;
    let feeds: Vec<Feed> = resp.json().await?;

    let mut cache = Cache::load()?;
    cache.add_ids(feeds.iter().map(|f| f.id.to_string()).collect());
    cache.save()?;

    if matches.get_flag("json") {
        println!("{}", to_string_pretty(&feeds).unwrap());
    } else {
        let mut table = new_table();
        table.set_header(vec!["id", "title"]);
        table.add_rows(feeds.iter().map(|f| {
            vec![
                f.id.to_string().chars().take(8).collect(),
                f.title.to_string(),
            ]
        }));
        println!("{table}");
    }

    Ok(())
}

async fn log(matches: &ArgMatches) -> Result<(), AppError> {
    let client = get_client()?;
    let cache = Cache::load()?;
    let id = matches.get_one::<String>("FEED_ID");
    let url = if let Some(id) = id {
        let id = cache.get_matching_id(id)?;
        get_api()?.join(&format!("feeds/{}/log", id))?
    } else {
        get_api()?.join("feeds/log")?
    };

    let resp = assert_ok(client.get(url).send().await?).await?;
    let updates: Vec<FeedLog> = resp.json().await?;

    if matches.get_flag("json") {
        println!("{}", to_string_pretty(&updates).unwrap());
    } else {
        let mut table = new_table();
        if id.is_some() {
            table.set_header(vec!["time", "success", "message"]);
            table.add_rows(updates.iter().map(|u| {
                let color = if u.success { Color::Reset } else { Color::Red };
                vec![
                    Cell::new(to_time_str(&u.time)).fg(color),
                    Cell::new(u.success.to_string()).fg(color),
                    Cell::new(u.message.clone().unwrap_or("".to_string()))
                        .fg(color),
                ]
            }));
        } else {
            table.set_header(vec!["feed_id", "time", "success", "message"]);
            table.add_rows(updates.iter().map(|u| {
                let color = if u.success { Color::Reset } else { Color::Red };
                let feed_id = substr(&u.feed_id.to_string(), 8);
                vec![
                    Cell::new(feed_id).fg(color),
                    Cell::new(to_time_str(&u.time)).fg(color),
                    Cell::new(u.success.to_string()).fg(color),
                    Cell::new(u.message.clone().unwrap_or("".to_string()))
                        .fg(color),
                ]
            }));
        }
        println!("{table}");
    }

    Ok(())
}

async fn stats(matches: &ArgMatches) -> Result<(), AppError> {
    let client = get_client()?;
    let path = if matches.get_flag("all") {
        "/feedstats?all=true"
    } else {
        "/feedstats"
    };
    let url = get_api()?.join(path)?;
    let resp = assert_ok(client.get(url).send().await?).await?;
    let stats: FeedStats = resp.json().await?;

    if matches.get_flag("json") {
        println!("{}", to_string_pretty(&stats).unwrap());
    } else {
        let url = get_api()?.join("feeds")?;
        let resp = assert_ok(client.get(url).send().await?).await?;
        let feeds: Vec<Feed> = resp.json().await?;

        let mut table = new_table();
        table.set_header(vec!["id", "title", "articles"]);
        table.add_rows(stats.feeds.iter().map(|(id, stat)| {
            let feed_id = substr(&id.to_string(), 8);
            let total = stat.clone().map_or(0, |s| s.total);
            let feed_name = feeds
                .iter()
                .find(|f| &f.id == id)
                .map_or("".into(), |f| f.title.clone());
            vec![feed_id, feed_name, total.to_string()]
        }));
        println!("{table}");
    }

    Ok(())
}

async fn articles(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let feed_id =
        cache.get_matching_id(matches.get_one::<String>("FEED_ID").unwrap())?;

    let client = get_client()?;
    let url = get_api()?.join(&format!("feeds/{}/articles", feed_id))?;
    let body = client.get(url).send().await?;
    let articles = body.json::<Vec<ArticleSummary>>().await?;

    if matches.get_flag("json") {
        println!("{}", to_string_pretty(&articles).unwrap());
    } else {
        let mut table = new_table();
        table.set_header(vec!["published", "title"]);
        table.add_rows(
            articles.iter().map(|a| {
                vec![to_time_str(&a.published), a.title.to_string()]
            }),
        );
        println!("{table}");
    }

    Ok(())
}
