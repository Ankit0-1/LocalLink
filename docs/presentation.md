# LocalLink Presentation Outline

## Problem

Quick commerce often depends on expensive dark stores, while local grocery vendors lack a direct digital storefront.

## Solution

LocalLink is a marketplace where vendors own stores and publish their own grocery products. Customers select a store and place a single-store order.

## Demo

Vendor registers, creates a store, and adds products. A customer selects that store and orders. The owning vendor accepts, prepares, and marks the order ready. A delivery partner accepts the newly available delivery job, picks up, and delivers. The customer sees live updates.

## Architecture

React clients communicate with Express via REST and Socket.IO. Services enforce store ownership and order lifecycle rules. Prisma persists users, stores, products, orders, and delivery requests in PostgreSQL.

## Future

Maps, store inventory, payments, routing, and vendor analytics.
