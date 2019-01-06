const MultiSigWallet = artifacts.require('MultiSigWallet')
const web3 = MultiSigWallet.web3
const deployMultisig = (owners, confirmations) => {
    return MultiSigWallet.new(owners, confirmations)
}

const utils = require('./utils')
const ONE_DAY = 24*3600

contract('MultiSigWallet', (accounts) => {
    let multisigInstance
    const requiredConfirmations = 2

    beforeEach(async () => {
        multisigInstance = await deployMultisig([accounts[0], accounts[1], accounts[2]], requiredConfirmations)
        assert.ok(multisigInstance)
    })
    it('adds an owner', async () => {
      const addOwnerData = multisigInstance.contract.addOwner.getData(accounts[3])
      const transactionId = utils.getParamFromTxEvent(
          await multisigInstance.submitTransaction(multisigInstance.address, 0, addOwnerData, {from: accounts[0]}),
          'transactionId',
          null,
          'Submission'
      )
      await multisigInstance.confirmTransaction(transactionId, {from: accounts[1]})
      assert.equal(multisigInstance.owners(3), accounts[3])

    })
    it('removes an owner', async () => {
      const removeOwnerData = multisigInstance.contract.removeOwner.getData(accounts[3])
      const transactionId = utils.getParamFromTxEvent(
          await multisigInstance.submitTransaction(multisigInstance.address, 0, removeOwnerData, {from: accounts[0]}),
          'transactionId',
          null,
          'Submission'
      )
      await multisigInstance.confirmTransaction(transactionId, {from: accounts[1]})
      assert.equal(multisigInstance.owners(3), 0)

    })
    it('replaces an owner', async () => {
      const replaceOwnerData = multisigInstance.contract.replaceOwner.getData(accounts[2], accounts[3])
      const transactionId = utils.getParamFromTxEvent(
          await multisigInstance.submitTransaction(multisigInstance.address, 0, replaceOwnerData, {from: accounts[0]}),
          'transactionId',
          null,
          'Submission'
      )
      await multisigInstance.confirmTransaction(transactionId, {from: accounts[1]})
      assert.equal(multisigInstance.owners(2), accounts[3])

    })
    it('prevents a non-owner from submitting a tx', async () => {
      const addOwnerData = multisigInstance.contract.replaceOwner.getData(accounts[3])
      let errorThrown = false
      try {
        await multisigInstance.submitTransaction(multisigInstance.address, 0, addOwnerData, {from: accounts[5]})
      } catch (e) {
        assert.match(e.message, /VM Exception while processing transaction: revert/, 'throws an error')
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('prevents a non-owner from confirming a tx', async () => {
      const addOwnerData = multisigInstance.contract.replaceOwner.getData(accounts[3])
      const transactionId = utils.getParamFromTxEvent(
          await multisigInstance.submitTransaction(multisigInstance.address, 0, addOwnerData, {from: accounts[0]}),
          'transactionId',
          null,
          'Submission'
      )
      let errorThrown = false
      try {
        await multisigInstance.confirmTransaction(transactionId, {from: accounts[5]})
      } catch (e) {
        assert.match(e.message, /VM Exception while processing transaction: revert/, 'throws an error')
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
})
