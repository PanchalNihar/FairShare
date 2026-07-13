export const calculateSettlements = (balances) => {

    const creditors = [];
    const debtors = [];

    balances.forEach(member => {

        if (member.balance > 0.01) {

            creditors.push({
                ...member
            });

        }

        else if (member.balance < -0.01) {

            debtors.push({
                ...member,
                balance: Math.abs(member.balance)
            });

        }

    });

    const settlements = [];

    let i = 0;
    let j = 0;

    while (
        i < creditors.length &&
        j < debtors.length
    ) {

        const creditor = creditors[i];

        const debtor = debtors[j];

        const amount = Math.min(
            creditor.balance,
            debtor.balance
        );

        const roundedAmount = Math.round(amount);

        if (roundedAmount > 0) {
            settlements.push({
                from: debtor.username,
                fromId: debtor.userId,
                to: creditor.username,
                toId: creditor.userId,
                amount: roundedAmount
            });
        }

        creditor.balance -= amount;

        debtor.balance -= amount;

        if (creditor.balance < 0.01)
            i++;

        if (debtor.balance < 0.01)
            j++;

    }

    return settlements;

};