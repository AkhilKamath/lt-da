use anchor_lang::prelude::*;

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
  // pub id: u64,
  pub link_counter: u64,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Link {
  pub id: u64,
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
      username: String
    ) -> Result<()> {
      msg!("Creating linktree account for username: {}", username);
      let linktree_account = &mut ctx.accounts.linktree_account;
      linktree_account.owner = ctx.accounts.owner.key();
      linktree_account.username = username;
      msg!("Linktree account created successfully");
      Ok(())
    }

    pub fn delete_linktree_account(
      _ctx: Context<DeleteLinkTreeAccount>,
      _username: String,
    ) -> Result<()> {
      msg!("Deleting linktree account");
      Ok(())
    }

    pub fn add_links(
      ctx: Context<AddLinks>,
      _username: String,
      urls: Vec<String>,
      titles: Vec<String>
    ) -> Result<()> {
      msg!("Adding links");
      require!(urls.len() == titles.len(), ErrorCode::LengthInputsNotSame);

      let linktree_account = &mut ctx.accounts.linktree_account;

      let new_links: Vec<Link> = urls
      .into_iter()
      .zip(titles.into_iter())
      .map(|(url, title)| {
          let new_id = linktree_account.link_counter;
          linktree_account.link_counter += 1;
          msg!("Adding link: id={}, title={}, url={}", new_id, title, url);
          Link {
          id: new_id,
          url,
          title,
          active: true
        }
      })
      .collect();
      
      ctx.accounts.linktree_account.links.extend(new_links);
      msg!("Links added successfully");
      Ok(())
    }
    pub fn delete_links(
      ctx: Context<DeleteLinks>,
      _username: String,
      link_ids: Vec<u64>
    ) -> Result<()> {
      msg!("Deleting links");
      let linktree_account = &mut ctx.accounts.linktree_account;
      let initial_count = linktree_account.links.len();
      linktree_account.links.retain(|link| !link_ids.contains(&link.id));
      let deleted_count = initial_count - linktree_account.links.len();
      msg!("Deleted {} links", deleted_count);
      Ok(())
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

#[derive(Accounts)]
#[instruction(username: String)]
pub struct DeleteLinkTreeAccount<'info> {
  #[account(
    mut,
    seeds = [username.as_bytes(), owner.key().as_ref()],
    bump,
    close = owner,
  )]
  pub linktree_account: Account<'info, LinkTreeAccount>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(username: String, urls: Vec<String>, titles: Vec<String>)]
pub struct AddLinks<'info> {
  #[account(
    mut,
    seeds = [username.as_bytes(), owner.key().as_ref()],
    bump,
    realloc = 8 + LinkTreeAccount::INIT_SPACE,
    realloc::payer = owner,
    realloc::zero = true,
  )]
  pub linktree_account: Account<'info, LinkTreeAccount>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(username: String, link_ids: Vec<u64>)]
pub struct DeleteLinks<'info> {
  #[account(
    mut,
    seeds = [username.as_bytes(), owner.key().as_ref()],
    bump,
    realloc = 8 + LinkTreeAccount::INIT_SPACE,
    realloc::payer = owner,
    realloc::zero = true,
  )]
  pub linktree_account: Account<'info, LinkTreeAccount>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>
}

#[error_code]
pub enum ErrorCode {
  #[msg("Number of urls and titles must be same")]
  LengthInputsNotSame,
}