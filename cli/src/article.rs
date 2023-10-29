use crate::{
    error::AppError,
    util::{get_client, Cache},
};
use clap::{arg, ArgMatches, Command};
use serde_json::to_string_pretty;
use server::Article;

pub(crate) fn command() -> Command {
    Command::new("article")
        .about("Manage articles")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("list")
                .about("List of articles")
                .arg(arg!([FEED_ID] "A feed ID"))
                .arg_required_else_help(false),
        )
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("list", sub_matches)) => list(sub_matches).await,
        _ => unreachable!(),
    }
}

async fn list(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let feed_id = if let Some(id) = matches.get_one::<String>("FEED_ID") {
        Some(cache.get_matching_id(id)?)
    } else {
        None
    };

    let client = get_client()?;
    let host = cache.get_host()?;
    let body = if let Some(id) = feed_id {
        client.get(format!("{}/feeds/{}/articles", host, id)).send().await?
    } else {
        client.get(format!("{}/articles", host)).send().await?
    };
    let articles = body.json::<Vec<Article>>().await?;

    println!("{}", to_string_pretty(&articles).unwrap());

    Ok(())
}
