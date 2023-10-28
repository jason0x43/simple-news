use crate::{error::AppError, util::{get_client, Cache}};
use clap::{ArgMatches, Command};

pub(crate) fn command() -> Command {
    Command::new("article")
        .about("Manage articles")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("article-get").about("Get the list of articles"),
        )
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("list", _)) => list().await,
        _ => unreachable!(),
    }
}

async fn list() -> Result<(), AppError> {
    let client = get_client()?;
    let cache = Cache::load()?;
    let host = cache.get_host()?;
    let body = client.get(format!("{}/articles", host)).send().await?;
    print!("{}", body.text().await?);
    Ok(())
}
