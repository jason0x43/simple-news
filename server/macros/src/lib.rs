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

        impl #ident {
            pub fn new() -> Self {
                Self(cuid2::create_id())
            }

            pub fn to_string(&self) -> String {
                self.0.clone()
            }
        }

        impl Display for #ident {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self.0)
            }
        }
    };
    output.into()
}
