import { calculateBalances } from "../services/balance.service.js";

export const getBalances = async (req, res) => {

    try {

        const result = await calculateBalances(req.params.groupId);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};