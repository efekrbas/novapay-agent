#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, Vec,
    log,
};

/// Escrow status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Active,
    Released,
    Refunded,
    Expired,
}

/// Escrow record stored on-chain
#[contracttype]
#[derive(Clone)]
pub struct EscrowRecord {
    pub escrow_id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub amount: i128,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub expires_at: u64,
    pub privacy_proof_hash: Symbol,
}

/// Data keys for contract storage
#[contracttype]
pub enum DataKey {
    Escrow(u64),
    NextId,
    Admin,
    TotalDeposited,
    TotalReleased,
}

#[contract]
pub struct NovaPayEscrow;

#[contractimpl]
impl NovaPayEscrow {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        env.storage().instance().set(&DataKey::TotalDeposited, &0i128);
        env.storage().instance().set(&DataKey::TotalReleased, &0i128);
        log!(&env, "NovaPay Escrow initialized by {}", admin);
    }

    /// Deposit funds into escrow
    /// The sender locks tokens that can later be released to the recipient
    pub fn deposit(
        env: Env,
        sender: Address,
        recipient: Address,
        token_address: Address,
        amount: i128,
        expiry_ledger: u64,
        privacy_proof: Symbol,
    ) -> u64 {
        // Require sender authorization
        sender.require_auth();

        // Validate amount
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Transfer tokens from sender to this contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        // Generate escrow ID
        let escrow_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0);

        // Create escrow record
        let record = EscrowRecord {
            escrow_id,
            sender: sender.clone(),
            recipient: recipient.clone(),
            token: token_address,
            amount,
            status: EscrowStatus::Active,
            created_at: env.ledger().timestamp(),
            expires_at: expiry_ledger,
            privacy_proof_hash: privacy_proof,
        };

        // Store escrow
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &record);

        // Update counters
        let next_id = escrow_id + 1;
        env.storage().instance().set(&DataKey::NextId, &next_id);

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDeposited)
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalDeposited, &(total + amount));

        log!(
            &env,
            "Escrow #{} created: {} tokens from {} to {}",
            escrow_id,
            amount,
            sender,
            recipient
        );

        escrow_id
    }

    /// Release escrowed funds to the recipient
    /// Can be called by either sender or admin
    pub fn release(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();

        let mut record: EscrowRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");

        // Verify caller is sender or admin
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");

        if caller != record.sender && caller != admin {
            panic!("Only sender or admin can release escrow");
        }

        // Verify escrow is active
        if record.status != EscrowStatus::Active {
            panic!("Escrow is not active");
        }

        // Transfer tokens to recipient
        let token_client = token::Client::new(&env, &record.token);
        token_client.transfer(
            &env.current_contract_address(),
            &record.recipient,
            &record.amount,
        );

        // Update status
        record.status = EscrowStatus::Released;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &record);

        // Update total released
        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalReleased)
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalReleased, &(total + record.amount));

        log!(&env, "Escrow #{} released to {}", escrow_id, record.recipient);
    }

    /// Refund escrowed funds back to the sender
    /// Can be called if escrow has expired, or by admin
    pub fn refund(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();

        let mut record: EscrowRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");

        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");

        // Allow refund if: expired, or caller is admin, or caller is sender after expiry
        let is_expired = env.ledger().timestamp() > record.expires_at;
        let is_admin = caller == admin;
        let is_sender = caller == record.sender;

        if !is_admin && !(is_sender && is_expired) {
            panic!("Cannot refund: not authorized or not expired");
        }

        if record.status != EscrowStatus::Active {
            panic!("Escrow is not active");
        }

        // Transfer tokens back to sender
        let token_client = token::Client::new(&env, &record.token);
        token_client.transfer(
            &env.current_contract_address(),
            &record.sender,
            &record.amount,
        );

        // Update status
        record.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &record);

        log!(&env, "Escrow #{} refunded to {}", escrow_id, record.sender);
    }

    /// Get escrow status and details
    pub fn get_escrow(env: Env, escrow_id: u64) -> EscrowRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found")
    }

    /// Get contract statistics
    pub fn get_stats(env: Env) -> (u64, i128, i128) {
        let next_id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        let total_deposited: i128 = env.storage().instance().get(&DataKey::TotalDeposited).unwrap_or(0);
        let total_released: i128 = env.storage().instance().get(&DataKey::TotalReleased).unwrap_or(0);
        (next_id, total_deposited, total_released)
    }

    /// Verify that a privacy proof hash matches the stored proof
    pub fn verify_privacy_proof(env: Env, escrow_id: u64, proof_hash: Symbol) -> bool {
        let record: EscrowRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");
        
        record.privacy_proof_hash == proof_hash
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, NovaPayEscrow);
        let client = NovaPayEscrowClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        env.mock_all_auths();
        
        client.initialize(&admin);
        
        let (count, deposited, released) = client.get_stats();
        assert_eq!(count, 0);
        assert_eq!(deposited, 0);
        assert_eq!(released, 0);
    }
}
