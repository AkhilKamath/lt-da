use anchor_lang::prelude::*;

declare_id!("6jnvkMV423aCV52ieVPpfXwj3oWR8wKbR275pjNKdvgZ");

// state of the program
// use InitSpace to calculate space
#[account]
#[derive(InitSpace)]
pub struct LinkTreeAccount {
  pub owner: Pubkey,
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

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}



#[derive(Accounts)]
pub struct Initialize {}
