// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 *  ArbiterEvaluator
 *  ----------------
 *  Sits in the `evaluator` slot of an ERC-8183 job. When Arbiter's off-chain
 *  court reaches a verdict, its authorised signer calls this contract, which
 *  relays `complete` or `reject` to the ERC-8183 AgenticCommerce contract —
 *  the call that releases or refunds the USDC escrow.
 *
 *  Parties set THIS contract's address as `evaluator` at createJob time.
 *
 *  BUILD PLAN (Phase 3):
 *   [ ] Store the ERC-8183 contract address + an authorised `signer` (our service).
 *   [ ] complete(jobId, reasonHash): onlySigner -> IERC8183(erc8183).complete(...)
 *   [ ] reject(jobId, reasonHash):   onlySigner -> IERC8183(erc8183).reject(...)
 *   [ ] (v1.1) hold a dispute deposit; refund winner, keep from loser.
 *   [ ] (v1.1) write outcome to ERC-8004 reputation for both parties + self.
 *   [ ] Deploy + verify on ArcScan; record address in docs/deployments.md.
 *
 *  SECURITY:
 *   - Only the authorised signer may pass a verdict.
 *   - reasonHash is the keccak256 of the off-chain evidence report (audit trail).
 */

interface IERC8183 {
    function complete(uint256 jobId, bytes32 reason, bytes calldata optParams) external;
    function reject(uint256 jobId, bytes32 reason, bytes calldata optParams) external;
}

contract ArbiterEvaluator {
    address public owner;
    address public signer;      // Arbiter's off-chain court signer
    IERC8183 public erc8183;    // Circle's AgenticCommerce on Arc testnet

    event VerdictDelivered(uint256 indexed jobId, bool passed, bytes32 reasonHash);

    error NotSigner();

    constructor(address erc8183_, address signer_) {
        owner = msg.sender;
        erc8183 = IERC8183(erc8183_);
        signer = signer_;
    }

    modifier onlySigner() {
        if (msg.sender != signer) revert NotSigner();
        _;
    }

    /// @notice Court says PASS — release escrow to the provider.
    function deliverPass(uint256 jobId, bytes32 reasonHash) external onlySigner {
        // TODO(Phase 3): erc8183.complete(jobId, reasonHash, "");
        emit VerdictDelivered(jobId, true, reasonHash);
    }

    /// @notice Court says FAIL — refund escrow to the client.
    function deliverFail(uint256 jobId, bytes32 reasonHash) external onlySigner {
        // TODO(Phase 3): erc8183.reject(jobId, reasonHash, "");
        emit VerdictDelivered(jobId, false, reasonHash);
    }

    // TODO(Phase 3): setSigner / dispute-deposit escrow / ERC-8004 hooks.
}
