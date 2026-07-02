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
    balances[member.user._id] = {
      userId: member.user._id,

      username: member.user.username,

      paid: 0,

      balance: 0,
    };
  });

  let totalExpense = 0;

  // Sum expenses
  expenses.forEach((expense) => {
    totalExpense += expense.amount;

    balances[expense.paidBy].paid += expense.amount;
  });

  const perPerson = totalExpense / group.members.length;

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
