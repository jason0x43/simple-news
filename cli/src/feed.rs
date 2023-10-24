use crate::{error::AppError, util::get_client};
use clap::{arg, ArgMatches, Command};
use reqwest::Url;
use serde_json::to_string_pretty;
use server::{AddFeedRequest, Feed, FeedKind};
use uuid::Uuid;

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
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("add", sub_matches)) => add(sub_matches).await,
        Some(("delete", sub_matches)) => delete(sub_matches).await,
        Some(("list", _)) => list().await,
        _ => unreachable!(),
    }
}

async fn add(matches: &ArgMatches) -> Result<(), AppError> {
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

async fn delete(matches: &ArgMatches) -> Result<(), AppError> {
    let id = matches.get_one::<String>("FEED_ID").unwrap();
    let id = Uuid::parse_str(&id)?;

    let client = get_client()?;
    let _body = client
        .delete(format!("http://localhost:3000/feeds/{}", id))
        .send()
        .await?;

    Ok(())
}

async fn list() -> Result<(), AppError> {
    let client = get_client()?;
    let body = client.get("http://localhost:3000/feeds").send().await?;
    let feeds: Vec<Feed> = body.json().await?;

    println!("{}", to_string_pretty(&feeds).unwrap());

    Ok(())
}
