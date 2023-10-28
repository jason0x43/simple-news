use crate::{
    error::AppError,
    util::{assert_ok, Cache},
};
use clap::{arg, ArgMatches, Command};
use reqwest::Client;
use server::{CreateSessionRequest, SessionResponse};
use std::io::{stdout, Write};

pub(crate) fn command() -> Command {
    Command::new("session")
        .about("Manage sessions")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("login")
                .about("Create a session")
                .arg(arg!(<USERNAME> "The user to login as"))
                .arg_required_else_help(true),
        )
        .subcommand(Command::new("logout").about("Clear the current session"))
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("login", sub_matches)) => create(sub_matches).await,
        Some(("logout", _)) => clear().await,
        _ => unreachable!()
    }
}

async fn create(matches: &ArgMatches) -> Result<(), AppError> {
    print!("Password: ");
    stdout().flush()?;
    let password = rpassword::read_password().unwrap();
    let username = matches.get_one::<String>("USERNAME").unwrap();

    let body = CreateSessionRequest {
        username: username.to_owned(),
        password,
    };

    let client = Client::builder().cookie_store(true).build()?;
    let resp = assert_ok(
        client
            .post("http://localhost:3000/login")
            .json(&body)
            .send()
            .await?,
    )
    .await?;
    let session = resp.json::<SessionResponse>().await?;

    println!("Logged in as {}", username);

    let mut cache = Cache::load()?;
    cache.session_id = Some(session.id);
    cache.save()?;

    Ok(())
}

async fn clear() -> Result<(), AppError> {
    let mut cache = Cache::load()?;
    cache.session_id = None;
    cache.save()?;
    println!("Logged out");
    Ok(())
}
