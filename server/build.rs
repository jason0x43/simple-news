use std::process::Command;

fn main() -> std::io::Result<()> {
    // Rebuild Typescript types
    println!("cargo:rerun-if-changed=src/types.rs");
    println!("cargo:rerun-if-changed=src/types-ts.rs");
    Command::new("tsync")
        .arg("-i")
        .arg("./src")
        .arg("-o")
        .arg("types.ts")
        .output()?;
    Ok(())
}
