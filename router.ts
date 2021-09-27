import { Router } from "express";
import messageStore from "./messageStore";

const router = Router();

router.get("/", (request, response) => {
    const messages = messageStore.messages;
    
    response.status(200).json({
        messages
    })
});

export default router;