use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(UuidId)]
pub fn from_uuid(input: TokenStream) -> TokenStream {
    let DeriveInput { ident, .. } = parse_macro_input!(input);
    let output = quote! {
        impl From<Uuid> for #ident {
            fn from(value: Uuid) -> Self {
                Self(value)
            }
        }

        impl TryFrom<String> for #ident {
            type Error = uuid::Error;
         
            fn try_from(value: String) -> Result<Self, Self::Error> {
              Ok(Self(Uuid::parse_str(&value)?))
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
