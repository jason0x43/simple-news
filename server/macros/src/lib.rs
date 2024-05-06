use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(Id)]
pub fn derive_id(input: TokenStream) -> TokenStream {
    let DeriveInput { ident, .. } = parse_macro_input!(input);
    let output = quote! {
        impl From<String> for #ident {
            fn from(value: String) -> Self {
                Self(value)
            }
        }

        impl From<&str> for #ident {
            fn from(value: &str) -> Self {
                Self(value.into())
            }
        }

        impl #ident {
            pub fn new() -> Self {
                Self(cuid2::create_id())
            }

            pub fn to_string(&self) -> String {
                self.0.clone()
            }

            pub fn as_str(&self) -> &str {
                &self.0
            }
        }

        impl Display for #ident {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self.0)
            }
        }

        impl Eq for #ident {}

        impl PartialEq for #ident {
            fn eq(&self, other: &#ident) -> bool {
                self.0 == other.0
            }
        }

        impl std::hash::Hash for #ident {
            fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
                self.0.hash(state);
            }
        }
    };
    output.into()
}
