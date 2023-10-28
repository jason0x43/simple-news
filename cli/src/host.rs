use clap::{arg, ArgMatches, Command};

use crate::{error::AppError, util::Cache};

pub(crate) fn command() -> Command {
    Command::new("host")
        .about("Manage hosts")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("set")
                .about("Set the current host")
                .arg(arg!(<HOST> "The host address"))
                .arg_required_else_help(true),
        )
        .subcommand(Command::new("show").about("Show the current host"))
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("set", sub_matches)) => set(sub_matches).await,
        Some(("show", _)) => show().await,
        _ => unreachable!(),
    }
}

async fn set(matches: &ArgMatches) -> Result<(), AppError> {
    let mut cache = Cache::load()?;
    cache.host = Some(matches.get_one::<String>("HOST").unwrap().into());
    cache.save()?;
    Ok(())
}

async fn show() -> Result<(), AppError> {
    let cache = Cache::load()?;
    if let Some(host) = cache.host {
        println!("{}", host);
    } else {
        println!("Host not set");
    }
    Ok(())
}
