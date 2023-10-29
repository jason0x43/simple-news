use crate::{
    error::AppError,
    util::{assert_ok, get_client},
};
use clap::{arg, ArgMatches, Command};
use serde_json::to_string_pretty;
use server::{CreateUserRequest, User};
use std::io::{stdout, Write};

pub(crate) fn command() -> Command {
    Command::new("user")
        .about("Manage users")
        .arg_required_else_help(true)
        .subcommand(
            Command::new("create")
                .about("Create a user")
                .arg(arg!(<USERNAME> "A username for the user"))
                .arg(arg!(<EMAIL> "The user's email address"))
                .arg_required_else_help(true),
        )
        .subcommand(
            Command::new("list")
                .about("List users")
                .arg_required_else_help(false),
        )
}

pub(crate) async fn handle(matches: &ArgMatches) -> Result<(), AppError> {
    match matches.subcommand() {
        Some(("create", sub_matches)) => create(sub_matches).await,
        Some(("list", _)) => list().await,
        _ => unreachable!(),
    }
}

async fn create(matches: &ArgMatches) -> Result<(), AppError> {
    print!("Password: ");
    stdout().flush()?;
    let password = rpassword::read_password().unwrap();
    let username = matches.get_one::<String>("USERNAME").unwrap();
    let email = matches.get_one::<String>("EMAIL").unwrap();

    let body = CreateUserRequest {
        username: username.to_owned(),
        email: email.to_owned(),
        password,
    };

    let client = get_client()?;
    assert_ok(
        client
            .post("http://localhost:3000/users")
            .json(&body)
            .send()
            .await?,
    )
    .await?;

    Ok(())
}

async fn list() -> Result<(), AppError> {
    let client = get_client()?;
    let resp =
        assert_ok(client.get("http://localhost:3000/users").send().await?)
            .await?;

    let users: Vec<User> = resp.json().await?;
    println!("{}", to_string_pretty(&users).unwrap());

    Ok(())
}
