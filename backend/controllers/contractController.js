import pool from "../config/db.js";

export const getContracts = async (req, res, next) => {
  try {
    // Only get contracts where the user is either the client or the freelancer
    const result = await pool.query(`
      SELECT c.*, p.freelancer_id, g.client_id
      FROM contract c
      JOIN proposal p ON c.proposal_id = p.proposal_id
      JOIN gig g ON p.gig_id = g.gig_id
      WHERE g.client_id = $1 OR p.freelancer_id = $1
      ORDER BY c.start_date DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getContractById = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.freelancer_id, g.client_id
      FROM contract c
      JOIN proposal p ON c.proposal_id = p.proposal_id
      JOIN gig g ON p.gig_id = g.gig_id
      WHERE c.contract_id = $1
    `, [req.params.id]);

    const contract = result.rows[0];

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (contract.client_id !== req.user.id && contract.freelancer_id !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to view this contract");
    }

    res.json(contract);
  } catch (error) {
    next(error);
  }
};

export const createContract = async (req, res, next) => {
  try {
    const { proposal_id, agreed_amount, start_date, delivery_date } = req.body;
    
    // Check if user is the client of the gig
    const propResult = await pool.query(`
      SELECT g.client_id, p.status FROM proposal p JOIN gig g ON p.gig_id = g.gig_id WHERE p.proposal_id = $1
    `, [proposal_id]);

    if (propResult.rows.length === 0) {
      res.status(404);
      throw new Error("Proposal not found");
    }

    if (propResult.rows[0].client_id !== req.user.id) {
      res.status(403);
      throw new Error("Only the client can create a contract");
    }

    if (propResult.rows[0].status !== "Accepted") {
      res.status(400);
      throw new Error("Cannot create a contract for a proposal that is not accepted");
    }

    const result = await pool.query(`
      INSERT INTO contract (proposal_id, agreed_amount, start_date, delivery_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [proposal_id, agreed_amount, start_date, delivery_date]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateContractStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // Active, Completed, Cancelled, Disputed
    
    const checkResult = await pool.query(`
      SELECT c.*, p.freelancer_id, g.client_id, g.gig_id
      FROM contract c
      JOIN proposal p ON c.proposal_id = p.proposal_id
      JOIN gig g ON p.gig_id = g.gig_id
      WHERE c.contract_id = $1
    `, [req.params.id]);

    const contract = checkResult.rows[0];
    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (contract.client_id !== req.user.id && contract.freelancer_id !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to update this contract");
    }

    const completionDate = status === 'Completed' ? new Date() : null;

    const result = await pool.query(`
      UPDATE contract SET status = $1, completion_date = COALESCE($2, completion_date) WHERE contract_id = $3 RETURNING *
    `, [status, completionDate, req.params.id]);

    if (status === 'Completed') {
       await pool.query("UPDATE gig SET status = 'Completed' WHERE gig_id = $1", [contract.gig_id]);
    } else if (status === 'Cancelled') {
       await pool.query("UPDATE gig SET status = 'Cancelled' WHERE gig_id = $1", [contract.gig_id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
