use std::fs;

use crate::{
    error::AppError,
    util::{assert_ok, get_client, get_host, Cache},
};
use clap::{arg, ArgMatches, Command};
use reqwest::Url;
use serde::Deserialize;
use serde_json::to_string_pretty;
use server::{AddFeedRequest, Feed, FeedKind};

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
                .about("Refresh a feed")
                .arg(arg!(<FEED_ID> "A feed ID"))
                .arg_required_else_help(true),
        )
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("add", sub_matches)) => add(sub_matches).await,
        Some(("load", sub_matches)) => load(sub_matches).await,
        Some(("show", sub_matches)) => show(sub_matches).await,
        Some(("delete", sub_matches)) => delete(sub_matches).await,
        Some(("list", _)) => list().await,
        Some(("refresh", sub_matches)) => refresh(sub_matches).await,
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
        title: title.to_string(),
        url,
        kind: FeedKind::Rss,
    };
    let client = get_client()?;
    let url = get_host()?.join("/feeds")?;
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
    let url = get_host()?.join(&format!("/feeds/{}", id))?;
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
    let url = get_host()?.join(&format!("/feeds/{}", id))?;
    assert_ok(client.delete(url).send().await?).await?;

    Ok(())
}

async fn refresh(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let id = matches.get_one::<String>("FEED_ID").unwrap();
    let id = cache.get_matching_id(id)?;
    let client = get_client()?;
    let url = get_host()?.join(&format!("/feeds/{}/refresh", id))?;
    assert_ok(client.get(url).send().await?).await?;

    Ok(())
}

async fn list() -> Result<(), AppError> {
    let client = get_client()?;
    let url = get_host()?.join("/feeds")?;
    let resp = assert_ok(client.get(url).send().await?).await?;
    let feeds: Vec<Feed> = resp.json().await?;

    let mut cache = Cache::load()?;
    cache.add_ids(feeds.iter().map(|f| f.id).collect());
    cache.save()?;

    println!("{}", to_string_pretty(&feeds).unwrap());

    Ok(())
}
