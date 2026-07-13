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
        owed: 0,
        balance: 0,
      };
    }
  });

  let totalExpense = 0;

  // Sum expenses using temporal splits
  expenses.forEach((expense) => {
    totalExpense += expense.amount;

    if (expense.paidBy) {
      const paidById = expense.paidBy.toString();
      if (balances[paidById]) {
        balances[paidById].paid += expense.amount;
      }
    }

    // Determine who was in the group when the expense occurred
    const expenseDate = new Date(expense.expenseDate || expense.createdAt);
    
    let activeMembers = group.members.filter((member) => {
      if (!member.user) return false;
      const joinedDate = new Date(member.joinedAt);
      return joinedDate <= expenseDate;
    });

    // Fallback: if no active members found, split among all current members
    if (activeMembers.length === 0) {
      activeMembers = group.members.filter(m => m.user);
    }

    const activeCount = activeMembers.length;
    if (activeCount > 0) {
      const share = expense.amount / activeCount;
      activeMembers.forEach((member) => {
        const memberId = member.user._id.toString();
        if (balances[memberId]) {
          balances[memberId].owed += share;
        }
      });
    }
  });

  // Calculate final balances
  Object.values(balances).forEach((member) => {
    member.balance = member.paid - member.owed;
  });

  const perPerson = group.members.length > 0 ? totalExpense / group.members.length : 0;
  const settlements = calculateSettlements(Object.values(balances));

  return {
    totalExpense,
    perPerson,
    balances: Object.values(balances),
    settlements,
  };
};
