use crate::{
    error::AppError,
    util::{assert_ok, get_client, get_host, new_table, to_time_str, Cache},
};
use clap::{arg, ArgMatches, Command};
use serde_json::to_string_pretty;
use server::{Article, Feed};

pub(crate) fn command() -> Command {
    Command::new("article")
        .about("Manage articles")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("list")
                .about("List of articles")
                .arg(arg!([FEED_ID] "A feed ID"))
                .arg(arg!(-j --json "Output raw JSON"))
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
    let body = if let Some(id) = &feed_id {
        client
            .get(format!("{}/feeds/{}/articles", host, id))
            .send()
            .await?
    } else {
        client.get(format!("{}/articles", host)).send().await?
    };
    let articles = body.json::<Vec<Article>>().await?;

    if matches.get_flag("json") {
        println!("{}", to_string_pretty(&articles).unwrap());
    } else {
        let url = get_host()?.join("/feeds")?;
        let resp = assert_ok(client.get(url).send().await?).await?;
        let feeds: Vec<Feed> = resp.json().await?;

        let mut table = new_table();
        if feed_id.is_some() {
            table.set_header(vec!["published", "title"]);
            table.add_rows(
                articles.iter().map(|a| {
                    vec![to_time_str(&a.published), a.title.to_string()]
                }),
            );
        } else {
            table.set_header(vec!["published", "feed", "title"]);
            table.add_rows(articles.iter().map(|a| {
                let feed_id = &a.feed_id;
                let feed_name = feeds
                    .iter()
                    .find(|f| &f.id == feed_id)
                    .map_or("".into(), |f| f.title.clone());
                vec![to_time_str(&a.published), feed_name, a.title.to_string()]
            }));
        }
        println!("{table}");
    }

    Ok(())
}
