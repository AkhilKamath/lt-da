use anchor_lang::{prelude::*, solana_program::address_lookup_table::instruction};

declare_id!("6jnvkMV423aCV52ieVPpfXwj3oWR8wKbR275pjNKdvgZ");

// state of the program
// use InitSpace to calculate space
#[account]
#[derive(InitSpace)]
pub struct LinkTreeAccount {
  pub owner: Pubkey,
  #[max_len(20)]
  pub username: String,
  #[max_len(10)]
  pub links: Vec<Link>,
  pub id: u64
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Link {
  #[max_len(50)]
  pub title: String,
  #[max_len(200)]
  pub url: String,
  pub active: bool
}

#[program]
pub mod linktree {
    use super::*;

    pub fn create_linktree_account(
      ctx: Context<CreateLinkTreeAccount>,
    ) {

    }
}



#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateLinkTreeAccount<'info> {
  #[account(
    init,
    seeds = [username.as_bytes(), owner.key().as_ref()],
    bump,
    payer = owner,
    space = 8 + LinkTreeAccount::INIT_SPACE,
  )]
  pub linktree_account: Account<'info, LinkTreeAccount>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>
}
