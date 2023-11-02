use std::str::from_utf8;

use rust_embed::RustEmbed;

use crate::error::AppError;

#[derive(RustEmbed)]
#[folder = "./src/templates/"]
struct Templates;

pub(crate) fn get_template(name: &str) -> Result<String, AppError> {
    let file =
        Templates::get(name).ok_or(AppError::FileNotFound(name.into()))?;
    let bstr = from_utf8(file.data.as_ref())?;
    Ok(bstr.into())
}
