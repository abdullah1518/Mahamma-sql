import pool from "../config/db.js";

// @desc    Get all gigs (with optional filtering)
// @route   GET /api/gigs?status=Open
// @access  Public
export const getGigs = async (req, res, next) => {
  try {
    const { status, clientId } = req.query;
    let query = `
      SELECT g.*, s.name as client_name, s.email as client_email, s.rating as client_rating
      FROM gig g
      JOIN student s ON g.client_id = s.id
      WHERE 1=1
    `;
    const values = [];

    if (status) {
      values.push(status);
      query += ` AND g.status = $${values.length}`;
    }
    if (clientId) {
      values.push(clientId);
      query += ` AND g.client_id = $${values.length}`;
    }

    query += ` ORDER BY g.posted_date DESC`;

    const result = await pool.query(query, values);
    
    // Convert to JSON format expected by frontend if needed
    const gigs = result.rows.map(row => ({
      gig_id: row.gig_id,
      ClientID: {
        id: row.client_id,
        Name: row.client_name,
        Email: row.client_email,
        Rating: row.client_rating
      },
      Title: row.title,
      Description: row.description,
      Budget: row.budget,
      Deadline: row.deadline,
      Status: row.status,
      posted_date: row.posted_date
    }));

    res.json(gigs);
  } catch (error) {
    next(error);
  }
};

// @desc    Get gig by ID
// @route   GET /api/gigs/:id
// @access  Public
export const getGigById = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT g.*, s.name as client_name, s.email as client_email, s.rating as client_rating, s.major as client_major
      FROM gig g
      JOIN student s ON g.client_id = s.id
      WHERE g.gig_id = $1
    `, [req.params.id]);

    const row = result.rows[0];

    if (row) {
      res.json({
        gig_id: row.gig_id,
        ClientID: {
          id: row.client_id,
          Name: row.client_name,
          Email: row.client_email,
          Rating: row.client_rating,
          Major: row.client_major
        },
        Title: row.title,
        Description: row.description,
        Budget: row.budget,
        Deadline: row.deadline,
        Status: row.status,
        posted_date: row.posted_date
      });
    } else {
      res.status(404);
      throw new Error("Gig not found");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a gig
// @route   POST /api/gigs
// @access  Private
export const createGig = async (req, res, next) => {
  try {
    const { Title, Description, Budget, Deadline } = req.body;

    if (Deadline) {
      const deadline = new Date(Deadline);
      if (isNaN(deadline.getTime()) || deadline <= new Date()) {
        res.status(400);
        throw new Error("Deadline must be a valid future date");
      }
    }

    const result = await pool.query(`
      INSERT INTO gig (client_id, title, description, budget, deadline)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, Title, Description, Budget, Deadline]);

    const newGig = result.rows[0];
    
    res.status(201).json({
      gig_id: newGig.gig_id,
      Title: newGig.title,
      Description: newGig.description,
      Budget: newGig.budget,
      Deadline: newGig.deadline,
      Status: newGig.status,
      posted_date: newGig.posted_date
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a gig
// @route   PUT /api/gigs/:id
// @access  Private (owner only)
export const updateGig = async (req, res, next) => {
  try {
    const { Title, Description, Budget, Status, Deadline } = req.body;

    const checkResult = await pool.query("SELECT client_id FROM gig WHERE gig_id = $1", [req.params.id]);
    const gig = checkResult.rows[0];

    if (!gig) {
      res.status(404);
      throw new Error("Gig not found");
    }

    if (gig.client_id !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to update this gig");
    }

    const result = await pool.query(`
      UPDATE gig 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          budget = COALESCE($3, budget),
          status = COALESCE($4, status),
          deadline = COALESCE($5, deadline)
      WHERE gig_id = $6
      RETURNING *
    `, [Title, Description, Budget, Status, Deadline, req.params.id]);

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a gig
// @route   DELETE /api/gigs/:id
// @access  Private (owner only)
export const deleteGig = async (req, res, next) => {
  try {
    const checkResult = await pool.query("SELECT client_id FROM gig WHERE gig_id = $1", [req.params.id]);
    const gig = checkResult.rows[0];

    if (!gig) {
      res.status(404);
      throw new Error("Gig not found");
    }

    if (gig.client_id !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to delete this gig");
    }

    await pool.query("DELETE FROM gig WHERE gig_id = $1", [req.params.id]);
    res.json({ message: "Gig removed" });
  } catch (error) {
    next(error);
  }
};
