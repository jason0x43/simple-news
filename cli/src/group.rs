use crate::{
    error::AppError,
    util::{assert_ok, get_client, get_host, Cache},
};
use clap::{arg, ArgMatches, Command};
use comfy_table::{presets::UTF8_FULL, ContentArrangement, Table};
use serde_json::to_string_pretty;
use server::{
    AddGroupFeedRequest, CreateFeedGroupRequest, Feed, FeedGroup, FeedGroupId,
    FeedId,
};

pub(crate) fn command() -> Command {
    Command::new("group")
        .about("Manage feed groups")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("create")
                .about("Create a feed group")
                .arg(arg!(<NAME> "A name for the feed"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("delete")
                .about("Delete a feed group")
                .arg(arg!(<FEED_GROUP_ID> "A feed group ID"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("list")
                .about("List feed groups")
                .arg(arg!(-j --json "Output raw JSON"))
                .arg_required_else_help(false),
        )
        .subcommand(
            Command::new("show")
                .about("Show a feed group")
                .arg(arg!(<FEED_GROUP_ID> "A feed group ID"))
                .arg(arg!(-j --json "Output raw JSON"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("add")
                .about("Add a feed to a group")
                .arg(arg!([FEED_GROUP_ID] "A feed group ID"))
                .arg(arg!([FEED_ID] "A feed ID"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("remove")
                .about("Remove a feed from a group")
                .arg(arg!([FEED_GROUP_ID] "A feed group ID"))
                .arg(arg!([FEED_ID] "A feed ID"))
                .arg_required_else_help(true),
        )
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("create", sub_matches)) => create(sub_matches).await,
        Some(("delete", sub_matches)) => delete(sub_matches).await,
        Some(("list", sub_matches)) => list(sub_matches).await,
        Some(("show", sub_matches)) => show(sub_matches).await,
        Some(("add", sub_matches)) => add(sub_matches).await,
        Some(("remove", sub_matches)) => remove(sub_matches).await,
        _ => unreachable!(),
    }
}

async fn create(matches: &ArgMatches) -> Result<(), AppError> {
    let name = matches.get_one::<String>("NAME").unwrap().clone();
    let body = CreateFeedGroupRequest { name: name.clone() };
    let client = get_client()?;
    let url = get_host()?.join("/feedgroups")?;
    assert_ok(client.post(url.clone()).json(&body).send().await?).await?;

    println!("Added feed group {}", name);

    Ok(())
}

async fn delete(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let id = matches.get_one::<String>("FEED_ID").unwrap();
    let id: FeedId = cache.get_matching_id(id)?.into();
    let client = get_client()?;
    let url = get_host()?.join(&format!("/feedgroups/{}", id))?;
    assert_ok(client.delete(url).send().await?).await?;

    Ok(())
}

async fn list(matches: &ArgMatches) -> Result<(), AppError> {
    let client = get_client()?;
    let url = get_host()?.join("/feedgroups")?;
    let resp = assert_ok(client.get(url).send().await?).await?;
    let feeds: Vec<FeedGroup> = resp.json().await?;

    let mut cache = Cache::load()?;
    cache.add_ids(feeds.iter().map(|f| f.id.to_string()).collect());
    cache.save()?;

    if matches.get_flag("json") {
        println!("{}", to_string_pretty(&feeds).unwrap());
    } else {
        let mut table = Table::new();
        table.load_preset(UTF8_FULL);
        table.set_content_arrangement(ContentArrangement::Dynamic);
        table.set_header(vec!["id", "name"]);
        table.add_rows(feeds.iter().map(|f| {
            vec![
                f.id.to_string().chars().take(8).collect(),
                f.name.to_string(),
            ]
        }));
        println!("{table}");
    }

    Ok(())
}

async fn show(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let id = matches.get_one::<String>("FEED_GROUP_ID").unwrap();
    let id: FeedGroupId = cache.get_matching_id(id)?.into();
    let client = get_client()?;
    let url = get_host()?.join(&format!("/feedgroups/{}", id))?;
    let resp = assert_ok(client.get(url).send().await?).await?;

    let feeds: Vec<Feed> = resp.json().await?;

    if matches.get_flag("json") {
        println!("{}", to_string_pretty(&feeds).unwrap());
    } else {
        let mut table = Table::new();
        table.load_preset(UTF8_FULL);
        table.set_content_arrangement(ContentArrangement::Dynamic);
        table.set_header(vec!["id", "name"]);
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

async fn add(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let group_id = matches.get_one::<String>("FEED_GROUP_ID").unwrap();
    let group_id: FeedGroupId = cache.get_matching_id(group_id)?.into();
    let feed_id = matches.get_one::<String>("FEED_ID").unwrap();
    let feed_id: FeedId = cache.get_matching_id(feed_id)?.into();
    let body = AddGroupFeedRequest { feed_id: feed_id.clone() };
    let client = get_client()?;
    let url = get_host()?.join(&format!("/feedgroups/{}", group_id))?;
    assert_ok(client.post(url.clone()).json(&body).send().await?).await?;

    println!("Added feed {} to group {}", feed_id, group_id);

    Ok(())
}

async fn remove(matches: &ArgMatches) -> Result<(), AppError> {
    let cache = Cache::load()?;
    let group_id = matches.get_one::<String>("FEED_GROUP_ID").unwrap();
    let group_id: FeedGroupId = cache.get_matching_id(group_id)?.into();
    let feed_id = matches.get_one::<String>("FEED_ID").unwrap();
    let feed_id: FeedId = cache.get_matching_id(feed_id)?.into();
    let client = get_client()?;
    let url =
        get_host()?.join(&format!("/feedgroups/{}/{}", group_id, feed_id))?;
    assert_ok(client.delete(url.clone()).send().await?).await?;

    println!("Removed feed {} from group {}", feed_id, group_id);

    Ok(())
}
