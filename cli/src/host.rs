use clap::{arg, ArgMatches, Command};

use crate::{
    error::AppError,
    util::{load_cache, save_cache},
};

pub(crate) fn set_command() -> Command {
    Command::new("host-set")
        .about("Set the current host")
        .arg(arg!(<HOST> "The host address"))
        .arg_required_else_help(true)
}

pub(crate) async fn set(matches: &ArgMatches) -> Result<(), AppError> {
    let mut cache = load_cache()?;
    cache.host = Some(matches.get_one::<String>("HOST").unwrap().into());
    save_cache(cache)?;
    Ok(())
}

pub(crate) fn show_command() -> Command {
    Command::new("host-show").about("Show the current host")
}

pub(crate) async fn show() -> Result<(), AppError> {
    let cache = load_cache()?;
    if let Some(host) = cache.host {
        println!("{}", host);
    } else {
        println!("Host not set");
    }
    Ok(())
}
