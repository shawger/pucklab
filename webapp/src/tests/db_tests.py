import os
import sys
import unittest

from pymongo import MongoClient

# For importing other modules!
path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(path)

import views.game as game


class TestDB(unittest.TestCase):

	@classmethod
	def setUpClass(self):
		client = MongoClient()
		self.db = client.pucklab
		self.data = game.getData(self.db,2015,"CGY",1)
		self.data2 = game.getData(self.db,2015,"EDM",1)

	def test_abv(self):

		self.assertEqual(self.data['for']['team']['abv'], 'CGY')
		self.assertEqual(self.data['against']['team']['abv'], 'VAN')

	def test_goals(self):

		self.assertEqual(len(self.data['for']['goals']),1)
		self.assertEqual(len(self.data['against']['goals']),5)

	def test_attempts(self):

		data = self.data

		numGoals = len(data['for']['goals'])

		attemptThatAreGoals = 0
		for a in data['for']['attempts']:

			if a['type'] == 'goal':
				attemptThatAreGoals += 1

		self.assertEqual(numGoals,attemptThatAreGoals)

		numGoals = len(data['against']['goals'])

		attemptThatAreGoals = 0
		for a in data['against']['attempts']:

			if a['type'] == 'goal':
				attemptThatAreGoals += 1

		self.assertEqual(numGoals,attemptThatAreGoals)

		data = self.data2

		numGoals = len(data['for']['goals'])

		attemptThatAreGoals = 0
		for a in data['for']['attempts']:

			if a['type'] == 'goal':
				attemptThatAreGoals += 1

		self.assertEqual(numGoals,attemptThatAreGoals)

		numGoals = len(data['against']['goals'])

		attemptThatAreGoals = 0
		for a in data['against']['attempts']:

			if a['type'] == 'goal':
				attemptThatAreGoals += 1

		self.assertEqual(numGoals,attemptThatAreGoals)



if __name__ == '__main__':
    unittest.main()


 #    	@classmethod
	# def setUpClass(self):
	# 	self.test = 1