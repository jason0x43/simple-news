use proc_macro::TokenStream;
use syn::{parse_macro_input, DeriveInput};
use quote::quote;

#[proc_macro_derive(UuidId)]
pub fn from_uuid(input: TokenStream) -> TokenStream {
    let DeriveInput { ident, .. } = parse_macro_input!(input);
    let output = quote! {
        impl From<Uuid> for #ident {
            fn from(value: Uuid) -> Self {
                Self(value)
            }
        }

        impl Id for #ident {
            fn uuid(&self) -> Uuid {
                self.0
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
