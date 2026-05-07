import pool from "../config/db.js";

export const getReviewsByStudent = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT r.*, s.name as reviewer_name, s.rating as reviewer_rating 
      FROM review r
      JOIN student s ON r.reviewer_id = s.id
      WHERE r.reviewee_id = $1
      ORDER BY r.review_date DESC
    `, [req.params.studentId]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { contract_id, reviewee_id, Score, Comment } = req.body;

    const contractCheck = await pool.query(`
      SELECT c.status, p.freelancer_id, g.client_id
      FROM contract c
      JOIN proposal p ON c.proposal_id = p.proposal_id
      JOIN gig g ON p.gig_id = g.gig_id
      WHERE c.contract_id = $1
    `, [contract_id]);

    const contract = contractCheck.rows[0];

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    if (contract.status !== "Completed") {
      res.status(400);
      throw new Error("Can only review completed contracts");
    }

    // Verify user is part of the contract and the reviewee is the OTHER party
    const isClient = contract.client_id === req.user.id;
    const isFreelancer = contract.freelancer_id === req.user.id;

    if (!isClient && !isFreelancer) {
       res.status(403);
       throw new Error("Not authorized to review this contract");
    }

    const expectedReviewee = isClient ? contract.freelancer_id : contract.client_id;
    
    if (reviewee_id !== expectedReviewee) {
       res.status(400);
       throw new Error("Invalid reviewee for this contract");
    }

    const existingReview = await pool.query(
      "SELECT review_id FROM review WHERE contract_id = $1 AND reviewer_id = $2",
      [contract_id, req.user.id]
    );

    if (existingReview.rows.length > 0) {
      res.status(400);
      throw new Error("You have already reviewed this contract");
    }

    const result = await pool.query(`
      INSERT INTO review (contract_id, reviewer_id, reviewee_id, score, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [contract_id, req.user.id, reviewee_id, Score, Comment]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
