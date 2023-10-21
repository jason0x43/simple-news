use crate::{error::AppError, util::{get_client, load_cache}};
use clap::Command;

pub(crate) fn get_articles_command() -> Command {
    Command::new("article-get").about("Get the list of articles")
}

pub(crate) async fn get_articles() -> Result<(), AppError> {
    let client = get_client()?;
    let cache = load_cache()?;
    let host = cache.get_host()?;
    let body = client.get(format!("{}/articles", host)).send().await?;
    print!("{}", body.text().await?);
    Ok(())
}
