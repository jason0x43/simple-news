use crate::{error::AppError, util::get_client};
use clap::{arg, ArgMatches, Command};
use reqwest::Url;
use serde_json::to_string_pretty;
use server::{AddFeedRequest, Feed, FeedKind};

pub(crate) fn add_command() -> Command {
    Command::new("feed-add")
        .about("Create a feed")
        .arg(arg!(<FEEDNAME> "A name for the feed"))
        .arg(arg!(<URL> "The feed's URL"))
        .arg_required_else_help(true)
}

pub(crate) async fn add(matches: &ArgMatches) -> Result<(), AppError> {
    let title = matches.get_one::<String>("FEEDNAME").unwrap();
    let url = matches.get_one::<String>("URL").unwrap();
    let url =
        Url::parse(&url).map_err(|err| AppError::Error(err.to_string()))?;

    let body = AddFeedRequest {
        title: title.to_string(),
        url,
        kind: FeedKind::Rss,
    };

    let client = get_client()?;
    let _body = client
        .post("http://localhost:3000/feeds")
        .json(&body)
        .send()
        .await?;

    Ok(())
}

pub(crate) fn list_command() -> Command {
    Command::new("feed-list")
        .about("List feeds")
        .arg_required_else_help(false)
}

pub(crate) async fn list() -> Result<(), AppError> {
    let client = get_client()?;
    let body = client.get("http://localhost:3000/feeds").send().await?;
    let feeds: Vec<Feed> = body.json().await?;

    println!("{}", to_string_pretty(&feeds).unwrap());

    Ok(())
}
