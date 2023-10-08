use crate::error::AppError;
use clap::{arg, ArgMatches, Command};
use reqwest::Client;
use server::CreateSessionRequest;
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

    let client = Client::new();
    let _body = client
        .post("http://localhost:3000/login")
        .json(&body)
        .send()
        .await?;

    Ok(())
}
