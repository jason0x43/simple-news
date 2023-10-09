use crate::{
    error::AppError,
    util::{assert_ok, load_cache, save_cache},
};
use clap::{arg, ArgMatches, Command};
use reqwest::Client;
use server::{CreateSessionRequest, SessionResponse};
use std::io::{stdout, Write};

pub(crate) fn login_command() -> Command {
    Command::new("login")
        .about("Login (create a session)")
        .arg(arg!(<USERNAME> "A username for the user"))
        .arg_required_else_help(true)
}

pub(crate) async fn create_session(
    matches: &ArgMatches,
) -> Result<(), AppError> {
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

    let mut cache = load_cache()?;
    cache.session_id = Some(session.id);
    save_cache(cache)?;

    Ok(())
}

pub(crate) fn logout_command() -> Command {
    Command::new("logout").about("Logout")
}

pub(crate) async fn clear_session() -> Result<(), AppError> {
    let mut cache = load_cache()?;
    cache.session_id = None;
    save_cache(cache)?;
    println!("Logged out");
    Ok(())
}
