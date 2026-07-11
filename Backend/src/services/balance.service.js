import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import { calculateSettlements } from "./settlement.service.js";
export const calculateBalances = async (groupId) => {
  const group = await Group.findById(groupId).populate(
    "members.user",
    "username email",
  );

  if (!group) {
    throw new Error("Group not found");
  }

  const expenses = await Expense.find({
    group: groupId,
  });

  const balances = {};

  // Initialize every member
  group.members.forEach((member) => {
    if (member.user) {
      balances[member.user._id.toString()] = {
        userId: member.user._id.toString(),

        username: member.user.username,

        paid: 0,

        balance: 0,
      };
    }
  });

  let totalExpense = 0;

  // Sum expenses
  expenses.forEach((expense) => {
    totalExpense += expense.amount;

    if (expense.paidBy) {
      const paidById = expense.paidBy.toString();
      if (balances[paidById]) {
        balances[paidById].paid += expense.amount;
      }
    }
  });

  const perPerson = group.members.length > 0 ? totalExpense / group.members.length : 0;

  Object.values(balances).forEach((member) => {
    member.balance = member.paid - perPerson;
  });
  const settlements = calculateSettlements(Object.values(balances));
  return {
    totalExpense,

    perPerson,

    balances: Object.values(balances),

    settlements,
  };
};
