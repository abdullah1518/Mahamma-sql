import pool from "../config/db.js";

export const getProposalsByGig = async (req, res, next) => {
  try {
    const gigResult = await pool.query("SELECT client_id FROM gig WHERE gig_id = $1", [req.params.gigId]);
    
    if (gigResult.rows.length === 0) {
      res.status(404);
      throw new Error("Gig not found");
    }
    
    const gig = gigResult.rows[0];

    if (gig.client_id !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to view proposals for this gig");
    }

    const proposalsResult = await pool.query(`
      SELECT p.*, s.name as freelancer_name, s.email as freelancer_email, s.rating as freelancer_rating, s.major as freelancer_major
      FROM proposal p
      JOIN student s ON p.freelancer_id = s.id
      WHERE p.gig_id = $1
      ORDER BY p.submitted_date DESC
    `, [req.params.gigId]);

    const proposals = proposalsResult.rows.map(row => ({
      proposal_id: row.proposal_id,
      gig_id: row.gig_id,
      FreelancerID: {
        id: row.freelancer_id,
        Name: row.freelancer_name,
        Email: row.freelancer_email,
        Rating: row.freelancer_rating,
        Major: row.freelancer_major
      },
      bid_amount: row.bid_amount,
      estimated_time: row.estimated_time,
      cover_letter: row.cover_letter,
      status: row.status,
      submitted_date: row.submitted_date
    }));

    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

export const getProposalById = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.name as f_name, s.email as f_email, s.rating as f_rating, s.major as f_major,
             g.title as g_title, g.description as g_desc, g.budget as g_budget, g.client_id as g_client_id
      FROM proposal p
      JOIN student s ON p.freelancer_id = s.id
      JOIN gig g ON p.gig_id = g.gig_id
      WHERE p.proposal_id = $1
    `, [req.params.id]);

    const row = result.rows[0];

    if (!row) {
      res.status(404);
      throw new Error("Proposal not found");
    }

    const isOwner = row.freelancer_id === req.user.id;
    const isClient = row.g_client_id === req.user.id;

    if (!isOwner && !isClient) {
      res.status(403);
      throw new Error("Not authorized to view this proposal");
    }

    res.json({
      proposal_id: row.proposal_id,
      FreelancerID: {
        id: row.freelancer_id,
        Name: row.f_name,
        Email: row.f_email,
        Rating: row.f_rating,
        Major: row.f_major
      },
      GigID: {
        id: row.gig_id,
        Title: row.g_title,
        Description: row.g_desc,
        Budget: row.g_budget,
        ClientID: row.g_client_id
      },
      bid_amount: row.bid_amount,
      estimated_time: row.estimated_time,
      cover_letter: row.cover_letter,
      status: row.status,
      submitted_date: row.submitted_date
    });
  } catch (error) {
    next(error);
  }
};

export const createProposal = async (req, res, next) => {
  try {
    const gigResult = await pool.query("SELECT client_id, status FROM gig WHERE gig_id = $1", [req.params.gigId]);
    if (gigResult.rows.length === 0) {
      res.status(404);
      throw new Error("Gig not found");
    }
    
    const gig = gigResult.rows[0];

    if (gig.status !== "Open") {
      res.status(400);
      throw new Error("Cannot submit a proposal on a gig that is not open");
    }

    if (gig.client_id === req.user.id) {
      res.status(400);
      throw new Error("You cannot submit a proposal on your own gig");
    }

    const existResult = await pool.query("SELECT proposal_id FROM proposal WHERE gig_id = $1 AND freelancer_id = $2", [req.params.gigId, req.user.id]);
    if (existResult.rows.length > 0) {
      res.status(400);
      throw new Error("You have already submitted a proposal for this gig");
    }

    const { BidAmount, EstimatedTime, CoverLetter } = req.body;

    const result = await pool.query(`
      INSERT INTO proposal (gig_id, freelancer_id, bid_amount, estimated_time, cover_letter)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.params.gigId, req.user.id, BidAmount, EstimatedTime, CoverLetter]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateProposalStatus = async (req, res, next) => {
  try {
    const { Status } = req.body;
    
    // Status in pg ENUM: 'Pending', 'Accepted', 'Rejected', 'Withdrawn'
    if (!["Accepted", "Rejected"].includes(Status)) {
      res.status(400);
      throw new Error("Status must be 'Accepted' or 'Rejected'");
    }

    const propResult = await pool.query(`
      SELECT p.*, g.client_id 
      FROM proposal p 
      JOIN gig g ON p.gig_id = g.gig_id 
      WHERE p.proposal_id = $1
    `, [req.params.id]);
    
    const proposal = propResult.rows[0];

    if (!proposal) {
      res.status(404);
      throw new Error("Proposal not found");
    }

    if (proposal.client_id !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to update this proposal");
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const updateRes = await client.query(`
        UPDATE proposal SET status = $1 WHERE proposal_id = $2 RETURNING *
      `, [Status, req.params.id]);

      if (Status === "Accepted") {
        await client.query(`
          UPDATE proposal SET status = 'Rejected' WHERE gig_id = $1 AND proposal_id != $2
        `, [proposal.gig_id, proposal.proposal_id]);

        await client.query(`
          UPDATE gig SET status = 'In Progress' WHERE gig_id = $1
        `, [proposal.gig_id]);
      }
      
      await client.query('COMMIT');
      res.json(updateRes.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const deleteProposal = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT freelancer_id, status FROM proposal WHERE proposal_id = $1", [req.params.id]);
    const proposal = result.rows[0];

    if (!proposal) {
      res.status(404);
      throw new Error("Proposal not found");
    }

    if (proposal.freelancer_id !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to delete this proposal");
    }

    if (proposal.status !== "Pending") {
      res.status(400);
      throw new Error("Cannot delete a proposal that is not pending");
    }

    await pool.query("DELETE FROM proposal WHERE proposal_id = $1", [req.params.id]);
    res.json({ message: "Proposal removed" });
  } catch (error) {
    next(error);
  }
};
