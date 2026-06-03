/* ============================================
   NovaPay — Privacy Shield Module
   Selective Disclosure & ZK Proof Simulation
   For Hack Privacy Track
   ============================================ */

class PrivacyShield {
    constructor() {
        this.isActive = true;
        this.proofs = [];
        this.credentials = null;
        this.disclosurePolicy = {};
        this.verificationLog = [];
        
        this._initDefaultCredentials();
        this._initDisclosurePolicy();
    }

    /**
     * Initialize default user credentials (stored locally only)
     */
    _initDefaultCredentials() {
        this.credentials = {
            // Private fields — NEVER disclosed
            private: {
                fullName: 'Efe K.',
                dateOfBirth: '1995-03-22',
                nationality: 'TR',
                passportNumber: 'U12345678',
                address: 'Istanbul, Turkey',
                ssn: '12345678901',
                phoneNumber: '+90 555 123 4567',
                email: 'efe@example.com'
            },
            // Derived claims — can be selectively disclosed
            claims: {
                isOver18: true,
                isOver21: true,
                kycLevel: 2,
                sanctionsClear: true,
                residencyCountry: 'TR',
                isAccreditedInvestor: false,
                amlVerified: true,
                pepStatus: false, // Politically Exposed Person
                riskScore: 'low'
            },
            // Issuer metadata
            issuer: {
                name: 'NovaPay Identity Provider',
                publicKey: 'GDNP...ISSUER',
                issuedAt: '2026-01-15T10:30:00Z',
                expiresAt: '2027-01-15T10:30:00Z',
                credentialType: 'VerifiableCredential',
                version: '1.0'
            }
        };
    }

    /**
     * Initialize disclosure policy — what gets shared with who
     */
    _initDisclosurePolicy() {
        this.disclosurePolicy = {
            // Standard transfer verification
            'transfer': {
                required: ['isOver18', 'kycLevel', 'sanctionsClear', 'amlVerified'],
                optional: ['residencyCountry'],
                neverDisclose: ['fullName', 'dateOfBirth', 'passportNumber', 'ssn', 'address']
            },
            // Large transfer (>$10,000)
            'largeTransfer': {
                required: ['isOver18', 'kycLevel', 'sanctionsClear', 'amlVerified', 'pepStatus'],
                optional: ['residencyCountry', 'riskScore'],
                neverDisclose: ['fullName', 'dateOfBirth', 'passportNumber', 'ssn']
            },
            // Regulatory compliance
            'regulatoryAudit': {
                required: ['kycLevel', 'sanctionsClear', 'amlVerified', 'pepStatus', 'riskScore'],
                optional: ['residencyCountry'],
                neverDisclose: ['fullName', 'dateOfBirth', 'passportNumber', 'ssn', 'address']
            }
        };
    }

    /**
     * Generate a selective disclosure proof
     * This simulates ZK proof generation
     */
    async generateProof(context = 'transfer', requestedClaims = null) {
        const policy = this.disclosurePolicy[context] || this.disclosurePolicy['transfer'];
        const claims = requestedClaims || policy.required;
        
        // Validate that no private fields are being disclosed
        const violations = claims.filter(c => 
            policy.neverDisclose?.includes(c) || 
            this.credentials.private.hasOwnProperty(c)
        );
        
        if (violations.length > 0) {
            return {
                success: false,
                error: `Privacy violation: Cannot disclose ${violations.join(', ')}`,
                violations: violations
            };
        }

        // Simulate ZK proof generation
        await this._delay(500);

        // Build the proof
        const proof = {
            id: 'proof_' + this._randomId(),
            type: 'SelectiveDisclosureProof',
            context: context,
            timestamp: new Date().toISOString(),
            
            // Disclosed claims (only what's needed)
            disclosedClaims: {},
            
            // Cryptographic proof components
            proofValue: {
                hash: '0x' + this._randomHash(),
                signature: '0x' + this._randomHash(),
                merkleRoot: '0x' + this._randomHash().substring(0, 32),
                nonce: this._randomId(),
            },
            
            // Verification metadata
            verification: {
                method: 'ZeroKnowledgeProof',
                algorithm: 'Groth16-BLS12-381',
                verifierContract: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTGYYY',
                isValid: true,
                verifiedAt: new Date().toISOString()
            },
            
            // Privacy metrics
            privacy: {
                fieldsTotal: Object.keys(this.credentials.private).length + Object.keys(this.credentials.claims).length,
                fieldsDisclosed: claims.length,
                fieldsHidden: Object.keys(this.credentials.private).length + Object.keys(this.credentials.claims).length - claims.length,
                privacyScore: 0,
                dataExposure: 'minimal'
            }
        };

        // Populate disclosed claims (only boolean/level assertions)
        claims.forEach(claim => {
            if (this.credentials.claims.hasOwnProperty(claim)) {
                const value = this.credentials.claims[claim];
                // For ZK: we disclose the claim result, not the underlying data
                if (typeof value === 'boolean') {
                    proof.disclosedClaims[claim] = value ? 'True ✓' : 'False ✗';
                } else if (typeof value === 'number') {
                    proof.disclosedClaims[claim] = `≥ Level ${value} ✓`;
                } else {
                    proof.disclosedClaims[claim] = String(value);
                }
            }
        });

        // Calculate privacy score
        proof.privacy.privacyScore = Math.round(
            ((proof.privacy.fieldsHidden / proof.privacy.fieldsTotal) * 100)
        );

        // Store proof
        this.proofs.push(proof);
        
        // Log verification
        this.verificationLog.push({
            proofId: proof.id,
            context: context,
            claims: claims,
            timestamp: proof.timestamp,
            result: 'verified'
        });

        return {
            success: true,
            proof: proof
        };
    }

    /**
     * Verify a proof (simulates on-chain verification)
     */
    async verifyProof(proofId) {
        await this._delay(300);
        
        const proof = this.proofs.find(p => p.id === proofId);
        if (!proof) {
            return { success: false, error: 'Proof not found' };
        }

        return {
            success: true,
            isValid: true,
            proofId: proofId,
            verifiedAt: new Date().toISOString(),
            verifierContract: proof.verification.verifierContract,
            claims: proof.disclosedClaims,
            privacyScore: proof.privacy.privacyScore + '%',
            txHash: '0x' + this._randomHash()
        };
    }

    /**
     * Get what a verifier would see
     */
    getVerifierView(proofId) {
        const proof = this.proofs.find(p => p.id === proofId);
        if (!proof) return null;

        const view = {
            // What the verifier CAN see
            verified: {},
            // What the verifier CANNOT see
            redacted: []
        };

        // Add disclosed claims
        Object.keys(proof.disclosedClaims).forEach(key => {
            view.verified[key] = proof.disclosedClaims[key];
        });

        // Add redacted fields (verifier knows they exist but can't see values)
        Object.keys(this.credentials.private).forEach(key => {
            view.redacted.push({
                field: key,
                value: '██████████',
                status: 'hidden'
            });
        });

        return view;
    }

    /**
     * Get privacy metrics for the dashboard
     */
    getPrivacyMetrics() {
        const totalVerifications = this.verificationLog.length;
        const successfulVerifications = this.verificationLog.filter(v => v.result === 'verified').length;
        
        return {
            shieldActive: this.isActive,
            totalProofs: this.proofs.length,
            totalVerifications: totalVerifications,
            successRate: totalVerifications > 0 
                ? Math.round((successfulVerifications / totalVerifications) * 100) 
                : 100,
            avgPrivacyScore: this.proofs.length > 0
                ? Math.round(this.proofs.reduce((sum, p) => sum + p.privacy.privacyScore, 0) / this.proofs.length)
                : 95,
            dataExposure: 'minimal',
            lastProof: this.proofs.length > 0 ? this.proofs[this.proofs.length - 1] : null
        };
    }

    /**
     * Toggle privacy shield
     */
    toggle() {
        this.isActive = !this.isActive;
        return this.isActive;
    }

    // ========== Utility ==========
    _randomHash() {
        return Array.from({ length: 64 }, () => 
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
    }

    _randomId() {
        return Array.from({ length: 16 }, () => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
        ).join('');
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton
window.privacyShield = new PrivacyShield();
